import type { Meal } from '../types/models';

export function recommendEmoji(input: { meal?: Meal; text?: string; hasBarcode?: boolean }): string {
  const t = (input.text || '').toLowerCase();
  if (input.hasBarcode) return '🏷️';

  if (/(coffee|latte|espresso)/.test(t)) return '☕️';
  if (/(protein|whey|shake)/.test(t)) return '🥤';
  // More specific food types first
  if (/(burger|cheeseburger|chicken burger|pizza|fries)/.test(t)) return '🍔';
  if (/(salad|vege|vegetable)/.test(t)) return '🥗';
  if (/(rice|noodle|pasta|bread)/.test(t)) return '🍚';
  if (/(chicken|beef|steak|fish|salmon|tuna|egg)/.test(t)) return '🍗';

  switch (input.meal) {
    case 'Breakfast':
      return '🍳';
    case 'Lunch':
      return '🥗';
    case 'Dinner':
      return '🍲';
    case 'Snack':
      return '🍎';
    default:
      return '🍽️';
  }
}
