import Constants from 'expo-constants';

type UsdaSearchItem = {
  fdcId: number;
  description?: string;
  brandName?: string;
  ingredients?: string;
  foodNutrients?: Array<{ nutrientName?: string; unitName?: string; value?: number }>;
};

type UsdaFoodFacts = {
  name: string;
  calories?: number;
  protein?: number;
};

function getUsdaKey(): string | undefined {
  const extra: any = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra;
  return extra?.usdaApiKey || undefined;
}

function pickNutrient(item: UsdaSearchItem, want: 'calories' | 'protein'): number | undefined {
  const ns = item.foodNutrients || [];

  // USDA uses various labels; this covers common cases.
  const matches = ns.filter((n) => {
    const name = (n.nutrientName || '').toLowerCase();
    if (want === 'protein') return name === 'protein';
    // energy can show as "Energy" in kcal
    if (want === 'calories') return name.includes('energy');
    return false;
  });

  // Prefer kcal for energy.
  for (const n of matches) {
    const unit = (n.unitName || '').toLowerCase();
    const v = typeof n.value === 'number' ? n.value : undefined;
    if (want === 'calories') {
      if (unit === 'kcal' && v != null) return v;
    } else {
      if (v != null) return v;
    }
  }

  // fallback
  const v = matches.find((m) => typeof m.value === 'number')?.value;
  return typeof v === 'number' ? v : undefined;
}

export async function usdaSearch(query: string): Promise<UsdaSearchItem[]> {
  const apiKey = getUsdaKey();
  if (!apiKey) return [];

  const q = String(query || '').trim();
  if (!q) return [];

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: q,
      pageSize: 8,
      // Branded tends to be more useful for packaged foods.
      dataType: ['Branded', 'Survey (FNDDS)'],
    }),
  });

  if (!res.ok) return [];
  const json: any = await res.json();
  const foods: UsdaSearchItem[] = Array.isArray(json?.foods) ? json.foods : [];
  return foods;
}

export function usdaFactsFromItem(item: UsdaSearchItem): UsdaFoodFacts {
  const desc = (item.description || '').trim();
  const brand = (item.brandName || '').trim();
  const name = brand ? `${desc} — ${brand}` : desc;

  const calories = pickNutrient(item, 'calories');
  const protein = pickNutrient(item, 'protein');

  return {
    name: name || 'Unknown food',
    calories,
    protein,
  };
}
