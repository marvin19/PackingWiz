import { PACKING_CATEGORY_ORDER, type PackingCategory, type PackingItem } from '@/domain/packing-item';

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

export function groupItemsByCategory(
  items: PackingItem[],
): { category: PackingCategory; items: PackingItem[] }[] {
  const filtered = items;

  return PACKING_CATEGORY_ORDER.map((category) => ({
    category,
    items: filtered.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}
