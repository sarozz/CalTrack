import type { Gender, Settings } from '../types/models';

// Simple, conservative defaults (not medical advice).
// We keep calories + protein as-is (user will customize later).
export function micronutrientDefaults(input: { gender?: Gender; age?: number }): Pick<Settings, 'fatGoal' | 'carbsGoal' | 'fiberGoal' | 'sugarGoal' | 'cholesterolGoal' | 'sodiumGoal'> {
  const gender = input.gender;
  const age = Number(input.age || 0);

  // Baseline: US label style “general healthy” limits.
  // Adjust fiber slightly by gender/age; keep others stable.
  let fiber = 28;
  if (gender === 'female') fiber = 25;
  if (age >= 51) fiber = gender === 'female' ? 21 : gender === 'male' ? 30 : fiber;

  return {
    fatGoal: 78,
    carbsGoal: 275,
    fiberGoal: fiber,
    sugarGoal: 50,
    cholesterolGoal: 300,
    sodiumGoal: 2300,
  };
}
