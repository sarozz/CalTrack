import type { Meal } from '../types/models';

export function autoMealFromTime(d: Date): Meal {
  const h = d.getHours();
  if (h < 11) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

// Lightweight demo parser. Supports things like:
// "burger 650" -> calories=650
// "650c 30p" or "650 cal 30 protein" -> calories=650, protein=30
export function parseNutritionFromText(text: string): { calories?: number; protein?: number } {
  const t = (text || '').toLowerCase();

  // protein patterns
  const proteinMatch = t.match(/(\d{1,3})(?:\s?g)?\s?(?:protein|prot|p)\b/);
  const protein = proteinMatch ? Number(proteinMatch[1]) : undefined;

  // calories patterns
  const calMatch = t.match(/(\d{2,4})\s?(?:kcal|cal|c)\b/);
  let calories = calMatch ? Number(calMatch[1]) : undefined;

  if (!calories) {
    // If there's a standalone 2-4 digit number, treat as calories.
    const standalone = t.match(/\b(\d{2,4})\b/);
    if (standalone) calories = Number(standalone[1]);
  }

  return {
    calories: Number.isFinite(calories) ? calories : undefined,
    protein: Number.isFinite(protein) ? protein : undefined,
  };
}
