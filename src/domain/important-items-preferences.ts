import type { ImportantItem } from '@/domain/important-item';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  defaultImportantItemsConfig,
  enabledImportantItemsFromConfig,
  isImportantFeatureActiveForConfig,
} from '@/domain/important-items-config';

/** @deprecated Use ImportantItemsConfig — kept for legacy import sites during MP4 migration. */
export type ImportantItemsPreferences = ImportantItemsConfig;

export const defaultImportantItemsPreferences: ImportantItemsPreferences =
  defaultImportantItemsConfig;

/** User-level Important Items preferences (not trip-scoped). */
export function isImportantFeatureActive(preferences: ImportantItemsPreferences): boolean {
  return isImportantFeatureActiveForConfig(preferences);
}

/** Master items to inject when generating a new trip. */
export function importantItemsForNewTrips(
  preferences: ImportantItemsPreferences,
): ImportantItem[] {
  return enabledImportantItemsFromConfig(preferences);
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
