export type PackingCategory =
  | 'Important'
  | 'Uncategorized'
  | 'Essentials'
  | 'Clothing'
  | 'Shoes'
  | 'Toiletries'
  | 'Electronics'
  | 'Activities'
  | 'Weather';

export type PackingItemSource = 'generated' | 'important';

export type PackingCategoryNormalizationContext = {
  source?: PackingItemSource;
  importantItemId?: string;
};

export interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  category: PackingCategory;
  packed: boolean;
  needToBuy: boolean;
  /** Traveler id, or null when shared / unassigned */
  assignedTo: string | null;
  /** User-authored personal note (variants, reminders, etc.) */
  note?: string;
  /** Distinguishes user-defined Important Items from AI/generated suggestions */
  source?: PackingItemSource;
  /** Profile Important Item id when source is important */
  importantItemId?: string;
}

export const PACKING_CATEGORY_ORDER: readonly PackingCategory[] = [
  'Important',
  'Uncategorized',
  'Essentials',
  'Clothing',
  'Shoes',
  'Toiletries',
  'Electronics',
  'Activities',
  'Weather',
] as const;

const PACKING_CATEGORY_SET = new Set<string>(PACKING_CATEGORY_ORDER);

/** Categories selectable in Add Item / Item Settings — excludes Important. */
export const SELECTABLE_PACKING_CATEGORIES: readonly PackingCategory[] = PACKING_CATEGORY_ORDER.filter(
  (category) => category !== 'Important',
);

/** Normalize persisted or external category strings at ingress boundaries. */
export function normalizePackingCategory(
  raw: string,
  context: PackingCategoryNormalizationContext = {},
): PackingCategory {
  if (context.source === 'important' || context.importantItemId || raw === 'Important') {
    return 'Important';
  }

  if (PACKING_CATEGORY_SET.has(raw)) {
    return raw as PackingCategory;
  }

  return 'Uncategorized';
}
