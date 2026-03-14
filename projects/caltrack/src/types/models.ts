export type ReminderMode = 'off' | 'daily' | 'smart';

export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type Settings = {
  // Profile (local-only)
  name?: string;
  gender?: Gender;
  age?: number;
  onboardingDone?: boolean;

  themeMode?: ThemeMode;

  caloriesGoal: number;
  proteinGoal: number;

  // micronutrients goals (daily)
  fatGoal: number; // g
  carbsGoal: number; // g
  fiberGoal: number; // g
  sugarGoal: number; // g
  cholesterolGoal: number; // mg
  sodiumGoal: number; // mg

  wakeTime: string; // HH:MM
  sleepTime: string; // HH:MM
  reminderMode: ReminderMode;
};

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export type Entry = {
  id: string;
  createdAt: number; // epoch ms
  dateKey: string; // YYYY-MM-DD local
  meal: Meal;
  /** Optional: recommended by the system (no manual picker). */
  emoji?: string;
  caption?: string;
  rawText?: string;

  calories: number;
  protein: number;

  // Optional micronutrients (auto-filled from USDA/OpenFoodFacts when available)
  fat?: number; // g
  carbs?: number; // g
  fiber?: number; // g
  sugar?: number; // g
  cholesterol?: number; // mg
  sodium?: number; // mg
};

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'dark',
  caloriesGoal: 2000,
  proteinGoal: 120,

  // Reasonable defaults (rough US label baselines)
  fatGoal: 78,
  carbsGoal: 275,
  fiberGoal: 28,
  sugarGoal: 50,
  cholesterolGoal: 300,
  sodiumGoal: 2300,

  wakeTime: '07:00',
  sleepTime: '23:00',
  reminderMode: 'off',
};
