import {
  PACKING_CATEGORY_ORDER,
  type PackingCategory,
  type PackingItem,
} from '@/domain/packing-item';
import { isImportantPackingItem } from '@/domain/important-snapshot';

export type PackingFilter = 'all' | 'todo' | 'buy';

export function filterPackingItems(items: PackingItem[], filter: PackingFilter): PackingItem[] {
  switch (filter) {
    case 'todo':
      return items.filter((item) => !item.packed);
    case 'buy':
      return items.filter((item) => item.needToBuy);
    default:
      return items;
  }
}

function resolvePackingCategory(item: PackingItem): PackingCategory {
  if (isImportantPackingItem(item)) {
    return 'Important';
  }

  return item.category;
}

export function groupItemsByCategory(
  items: PackingItem[],
): { category: PackingCategory; items: PackingItem[] }[] {
  return PACKING_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => resolvePackingCategory(item) === category),
  })).filter((group) => group.items.length > 0);
}
