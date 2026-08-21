import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';
import {
  getTripImportantItems,
  isImportantPackingItem,
} from '@/domain/important-snapshot';
import { createUuid } from '@/lib/id';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function findMatchingTripItem(
  masterItem: ImportantItem,
  tripImportant: PackingItem[],
  usedTripItemIds: Set<string>,
): PackingItem | undefined {
  const byId = tripImportant.find(
    (item) => item.importantItemId === masterItem.id && !usedTripItemIds.has(item.id),
  );
  if (byId) {
    return byId;
  }

  const masterName = normalizeName(masterItem.name);
  return tripImportant.find(
    (item) => !usedTripItemIds.has(item.id) && normalizeName(item.name) === masterName,
  );
}

function toImportantPackingItem(
  masterItem: ImportantItem,
  existing?: PackingItem,
): PackingItem {
  if (existing) {
    return {
      ...existing,
      name: masterItem.name,
      quantity: Math.max(existing.quantity, masterItem.quantity),
      category: 'Important',
      source: 'important',
      importantItemId: masterItem.id,
    };
  }

  return {
    id: createUuid(),
    name: masterItem.name,
    quantity: masterItem.quantity,
    category: 'Important',
    packed: false,
    needToBuy: false,
    assignedTo: null,
    source: 'important',
    importantItemId: masterItem.id,
  };
}

/**
 * Synchronizes only the active trip's Important snapshot with the current master list.
 * Preserves trip-level state for items that remain; does not touch non-Important items.
 */
export function syncTripImportantSnapshot(
  tripItems: PackingItem[],
  masterItems: ImportantItem[],
): PackingItem[] {
  const enabledMaster = masterItems.filter((item) => item.enabled);
  const tripImportant = getTripImportantItems(tripItems);
  const nonImportant = tripItems.filter((item) => !isImportantPackingItem(item));
  const usedTripItemIds = new Set<string>();

  const syncedImportant: PackingItem[] = enabledMaster.map((masterItem) => {
    const existing = findMatchingTripItem(masterItem, tripImportant, usedTripItemIds);
    if (existing) {
      usedTripItemIds.add(existing.id);
    }

    return toImportantPackingItem(masterItem, existing);
  });

  return [...syncedImportant, ...nonImportant];
}
