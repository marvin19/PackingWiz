import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

/** Stable key for comparing master Important Items with trip snapshots. */
export function importantItemKey(item: {
  importantItemId?: string;
  id?: string;
  name: string;
}): string {
  const masterId = item.importantItemId ?? item.id;
  if (masterId) {
    return `id:${masterId}`;
  }

  return `name:${normalizeName(item.name)}`;
}

export function isImportantPackingItem(item: PackingItem): boolean {
  return item.category === 'Important' || item.source === 'important';
}

export function getTripImportantItems(items: PackingItem[]): PackingItem[] {
  return items.filter(isImportantPackingItem);
}

/**
 * Fingerprint of the active Important master configuration.
 * Includes enabled state and updatedAt so toggling ON or saving a new master
 * invalidates prior per-trip dismissals without auto-syncing historical trips.
 */
export function buildImportantMasterVersion(config: ImportantItemsConfig): string {
  const itemPart = config.items
    .filter((item) => item.enabled)
    .map((item) => importantItemKey(item))
    .sort()
    .join('|');

  return `${config.isEnabled ? '1' : '0'}:${config.updatedAt ?? ''}|${itemPart}`;
}

/** Exact comparison — no fuzzy name matching. */
export function isImportantSnapshotStale(
  masterItems: ImportantItem[],
  tripItems: PackingItem[],
): boolean {
  const masterKeys = new Set(
    masterItems.filter((item) => item.enabled).map((item) => importantItemKey(item)),
  );
  const tripKeys = new Set(getTripImportantItems(tripItems).map((item) => importantItemKey(item)));

  if (masterKeys.size !== tripKeys.size) {
    return true;
  }

  for (const key of masterKeys) {
    if (!tripKeys.has(key)) {
      return true;
    }
  }

  return false;
}
