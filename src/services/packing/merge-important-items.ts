import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';
import { createUuid } from '@/lib/id';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function namesOverlap(generatedName: string, importantName: string): boolean {
  const generated = normalizeName(generatedName);
  const important = normalizeName(importantName);

  if (!generated || !important) {
    return false;
  }

  return generated.includes(important) || important.includes(generated);
}

/**
 * Ensures enabled Important Items appear in the final packing list.
 * When a generated item already covers an important item, the existing row is upgraded
 * to the Important category instead of duplicated.
 */
export function mergeImportantItems(
  generatedItems: PackingItem[],
  importantItems: ImportantItem[],
): PackingItem[] {
  const enabledItems = importantItems.filter((item) => item.enabled);
  if (enabledItems.length === 0) {
    return generatedItems;
  }

  const merged = generatedItems.map((item) => ({ ...item }));

  for (const importantItem of enabledItems) {
    const duplicateIndex = merged.findIndex(
      (item) =>
        item.importantItemId === importantItem.id ||
        namesOverlap(item.name, importantItem.name),
    );

    if (duplicateIndex >= 0) {
      const existing = merged[duplicateIndex];
      merged[duplicateIndex] = {
        ...existing,
        name: importantItem.name,
        quantity: Math.max(existing.quantity, importantItem.quantity),
        category: 'Important',
        source: 'important',
        importantItemId: importantItem.id,
      };
      continue;
    }

    merged.unshift({
      id: createUuid(),
      name: importantItem.name,
      quantity: importantItem.quantity,
      category: 'Important',
      packed: false,
      needToBuy: false,
      assignedTo: null,
      source: 'important',
      importantItemId: importantItem.id,
    });
  }

  return merged;
}
