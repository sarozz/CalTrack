export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateLabel(dateKey: string) {
  // YYYY-MM-DD -> DD Mon
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
}
