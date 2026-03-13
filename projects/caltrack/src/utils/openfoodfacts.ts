export type FoodFacts = {
  name?: string;
  calories?: number; // kcal
  protein?: number; // grams
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

  const calories100g = num(nutr['energy-kcal_100g']);
  const protein100g = num(nutr['proteins_100g']);

  const name = product.product_name || product.abbreviated_product_name || product.generic_name;

  if (caloriesServing != null || proteinServing != null) {
    return {
      name,
      calories: caloriesServing,
      protein: proteinServing,
      source: 'serving',
    };
  }

  if (calories100g != null || protein100g != null) {
    return {
      name,
      calories: calories100g,
      protein: protein100g,
      source: '100g',
    };
  }

  // Product exists but no usable macros.
  return { name, source: '100g' };
}
