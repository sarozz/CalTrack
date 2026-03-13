export type ReminderMode = 'off' | 'daily' | 'smart';

export type Settings = {
  caloriesGoal: number;
  proteinGoal: number;
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
};

export const DEFAULT_SETTINGS: Settings = {
  caloriesGoal: 2000,
  proteinGoal: 120,
  wakeTime: '07:00',
  sleepTime: '23:00',
  reminderMode: 'off',
};
