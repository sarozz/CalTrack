export type QuickFact = {
  calories: number; // kcal
  protein: number; // grams
};

// Very rough defaults for common foods when user types text and doesn't pick a USDA suggestion.
// These are *heuristics* and should be overwritten by USDA/OpenFoodFacts when available.
const MAP: Array<{ re: RegExp; fact: QuickFact }> = [
  // chicken burger / burger
  { re: /\b(chicken\s*burger|burger|cheeseburger)\b/i, fact: { calories: 420, protein: 26 } },
  { re: /\b(chicken\s*sandwich)\b/i, fact: { calories: 380, protein: 25 } },
  { re: /\b(grilled\s*chicken)\b/i, fact: { calories: 280, protein: 45 } },
];

export function guessCaloriesProtein(text: string): QuickFact | null {
  const t = (text || '').trim();
  if (!t) return null;
  for (const m of MAP) {
    if (m.re.test(t)) return m.fact;
  }
  return null;
}
