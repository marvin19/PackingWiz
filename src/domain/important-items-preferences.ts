import type { ImportantItem } from '@/domain/important-item';

/** User-level Important Items preferences (not trip-scoped). */
export type ImportantItemsPreferences = {
  /** Master list of reusable Important Items */
  items: ImportantItem[];
  /** User has completed initial Important Items setup at least once */
  isConfigured: boolean;
  /** Whether Important Items are active for new packing lists */
  isEnabled: boolean;
  /** User chose "Not now" on the Pack screen empty state */
  promptDismissed: boolean;
  /** ISO timestamp when the master list was last explicitly saved */
  updatedAt?: string;
};

export const defaultImportantItemsPreferences: ImportantItemsPreferences = {
  items: [],
  isConfigured: false,
  isEnabled: false,
  promptDismissed: false,
};

/** Important feature is active for new trips and Pack UI when configured and enabled. */
export function isImportantFeatureActive(preferences: ImportantItemsPreferences): boolean {
  return preferences.isConfigured && preferences.isEnabled;
}

/** Master items to inject when generating a new trip. */
export function importantItemsForNewTrips(
  preferences: ImportantItemsPreferences,
): ImportantItem[] {
  if (!isImportantFeatureActive(preferences)) {
    return [];
  }

  return preferences.items.filter((item) => item.enabled);
}

export function dedupeImportantItemNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}
