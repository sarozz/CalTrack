import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type Entry, type Settings } from '../types/models';

const ENTRIES_KEY = 'caltrack_entries_v1';
const SETTINGS_KEY = 'caltrack_settings_v1';

export async function loadEntries(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: Entry[]) {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function addEntry(entry: Entry) {
  const entries = await loadEntries();
  const next = [entry, ...entries].sort((a, b) => b.createdAt - a.createdAt);
  await saveEntries(next);
  return next;
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  const entries = await loadEntries();
  const next = entries
    .map((e) => (e.id === id ? { ...e, ...patch } : e))
    .sort((a, b) => b.createdAt - a.createdAt);
  await saveEntries(next);
  return next;
}

export async function deleteEntry(id: string) {
  const entries = await loadEntries();
  const next = entries.filter((e) => e.id !== id);
  await saveEntries(next);
  return next;
}

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearAll() {
  await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY]);
}
