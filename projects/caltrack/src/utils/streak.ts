import type { Entry } from '../types/models';

function dateKeyToDate(dateKey: string): Date {
  // dateKey is YYYY-MM-DD in local time
  const [y, m, d] = dateKey.split('-').map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeStreak(entries: Entry[]): { current: number; best: number; daysThisWeek: number } {
  const daySet = new Set(entries.map((e) => e.dateKey));

  // Current streak ending today (local)
  let cur = 0;
  let cursor = new Date();
  while (true) {
    const key = toDateKeyLocal(cursor);
    if (!daySet.has(key)) break;
    cur += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak in history
  const days = Array.from(daySet.values()).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = dateKeyToDate(k);
    if (!prev) {
      run = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prev.getTime()) / (24 * 3600 * 1000));
      run = diffDays === 1 ? run + 1 : 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  // Days logged this week (Mon-Sun)
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekKeys.add(toDateKeyLocal(d));
  }
  let daysThisWeek = 0;
  for (const k of weekKeys) if (daySet.has(k)) daysThisWeek += 1;

  return { current: cur, best, daysThisWeek };
}
