/**
 * English count + noun labels for user-facing copy.
 * Centralizes manual pluralization for future locale-aware formatting.
 */

/** Singular or plural noun for a count — for templates like "N saved items". */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Generic count label — e.g. 1 day, 3 days. */
export function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

export function formatAgeYears(age: number): string {
  return formatCountLabel(age, 'year', 'years');
}

export function formatTripDurationDays(days: number): string {
  return formatCountLabel(days, 'day', 'days');
}

export function formatItemCount(count: number): string {
  return formatCountLabel(count, 'item', 'items');
}
