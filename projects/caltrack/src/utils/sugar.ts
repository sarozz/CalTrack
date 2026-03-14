// Sugar helper: supports quick inputs like "2 tsp sugar" or "1 tbsp sugar".
// Conversion (approx): 1 tsp sugar ~ 4g, 1 tbsp ~ 12g.

export function parseSugarFromText(text: string): { sugarG?: number; source?: 'tsp' | 'tbsp' | 'g' } {
  const t = (text || '').toLowerCase();

  // grams
  const g = t.match(/(\d+(?:\.\d+)?)\s?g\s*(?:sugar|sug)\b/);
  if (g) {
    const n = Number(g[1]);
    return { sugarG: Number.isFinite(n) ? n : undefined, source: 'g' };
  }

  // tsp
  const tsp = t.match(/(\d+(?:\.\d+)?)\s*(?:tsp|teaspoon|teaspoons)\s*(?:of\s*)?(?:sugar|sug)\b/);
  if (tsp) {
    const n = Number(tsp[1]);
    if (Number.isFinite(n)) return { sugarG: n * 4, source: 'tsp' };
  }

  // tbsp
  const tbsp = t.match(/(\d+(?:\.\d+)?)\s*(?:tbsp|tablespoon|tablespoons)\s*(?:of\s*)?(?:sugar|sug)\b/);
  if (tbsp) {
    const n = Number(tbsp[1]);
    if (Number.isFinite(n)) return { sugarG: n * 12, source: 'tbsp' };
  }

  return {};
}
