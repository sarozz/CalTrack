export type FoodFacts = {
  name?: string;
  calories?: number; // kcal
  protein?: number; // grams
  fat?: number; // g
  carbs?: number; // g
  fiber?: number; // g
  sugar?: number; // g
  cholesterol?: number; // mg (often missing)
  sodium?: number; // mg
  source: 'serving' | '100g';
};

function num(v: any): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Lookup a product by barcode using OpenFoodFacts.
 * No API key.
 *
 * Docs: https://openfoodfacts.github.io/api-documentation/
 */
export async function lookupOpenFoodFacts(barcode: string): Promise<FoodFacts | null> {
  const code = String(barcode || '').trim();
  if (!code) return null;

  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json: any = await res.json();
  if (!json || json.status !== 1) return null;

  const product = json.product || {};
  const nutr = product.nutriments || {};

  // Prefer per-serving when available.
  const caloriesServing = num(nutr['energy-kcal_serving']);
  const proteinServing = num(nutr['proteins_serving']);
  const fatServing = num(nutr['fat_serving']);
  const carbsServing = num(nutr['carbohydrates_serving']);
  const fiberServing = num(nutr['fiber_serving']);
  const sugarServing = num(nutr['sugars_serving']);
  const sodiumServingMg = num(nutr['sodium_serving']); // can be g

  const calories100g = num(nutr['energy-kcal_100g']);
  const protein100g = num(nutr['proteins_100g']);
  const fat100g = num(nutr['fat_100g']);
  const carbs100g = num(nutr['carbohydrates_100g']);
  const fiber100g = num(nutr['fiber_100g']);
  const sugar100g = num(nutr['sugars_100g']);
  const sodium100g = num(nutr['sodium_100g']);

  const name = product.product_name || product.abbreviated_product_name || product.generic_name;

  // OpenFoodFacts sodium values are usually in grams; convert to mg for consistency.
  const sodiumServing = sodiumServingMg != null ? Math.round(sodiumServingMg * 1000) : undefined;
  const sodium100 = sodium100g != null ? Math.round(sodium100g * 1000) : undefined;

  if (
    caloriesServing != null ||
    proteinServing != null ||
    fatServing != null ||
    carbsServing != null ||
    fiberServing != null ||
    sugarServing != null ||
    sodiumServing != null
  ) {
    return {
      name,
      calories: caloriesServing,
      protein: proteinServing,
      fat: fatServing,
      carbs: carbsServing,
      fiber: fiberServing,
      sugar: sugarServing,
      sodium: sodiumServing,
      source: 'serving',
    };
  }

  if (
    calories100g != null ||
    protein100g != null ||
    fat100g != null ||
    carbs100g != null ||
    fiber100g != null ||
    sugar100g != null ||
    sodium100 != null
  ) {
    return {
      name,
      calories: calories100g,
      protein: protein100g,
      fat: fat100g,
      carbs: carbs100g,
      fiber: fiber100g,
      sugar: sugar100g,
      sodium: sodium100,
      source: '100g',
    };
  }

  // Product exists but no usable macros.
  return { name, source: '100g' };
}
