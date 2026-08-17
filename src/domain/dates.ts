const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function durationDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) {
    return 0;
  }
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export function formatRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) {
    return 'Add dates';
  }
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const startStr = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`;
  const sameMonth = start.getMonth() === end.getMonth();
  const endStr = sameMonth
    ? `${end.getDate()}`
    : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
  return `${startStr}–${endStr}`;
}
