import {
  TRIP_CONTEXT_ALL_TAGS,
  TRIP_CONTEXT_EXTENDED_TAGS,
  TRIP_CONTEXT_PRIMARY_TAGS,
} from '@/domain/catalog';

export { TRIP_CONTEXT_ALL_TAGS, TRIP_CONTEXT_EXTENDED_TAGS, TRIP_CONTEXT_PRIMARY_TAGS };

export function normalizeTripContextTag(tag: string): string {
  return tag.trim();
}

export function tripContextTagKey(tag: string): string {
  return normalizeTripContextTag(tag).toLowerCase();
}

export function tripContextIncludes(tags: string[], tag: string): boolean {
  const key = tripContextTagKey(tag);
  return tags.some((entry) => tripContextTagKey(entry) === key);
}

export function findTripContextTag(tags: string[], tag: string): string | undefined {
  const key = tripContextTagKey(tag);
  return tags.find((entry) => tripContextTagKey(entry) === key);
}

export function isPrimaryTripContextTag(tag: string): boolean {
  return TRIP_CONTEXT_PRIMARY_TAGS.some((entry) => tripContextTagKey(entry) === tripContextTagKey(tag));
}

export function isKnownTripContextTag(tag: string): boolean {
  return TRIP_CONTEXT_ALL_TAGS.some((entry) => tripContextTagKey(entry) === tripContextTagKey(tag));
}

/** Tags selected on the draft that are not shown in the primary chip row. */
export function getExtraTripContextTags(selectedTags: string[]): string[] {
  return selectedTags.filter((tag) => !isPrimaryTripContextTag(tag));
}

export function filterKnownTripContextTags(query: string): readonly string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return TRIP_CONTEXT_ALL_TAGS;
  }

  return TRIP_CONTEXT_ALL_TAGS.filter((tag) => tag.toLowerCase().includes(trimmed));
}
