export type PackingCategory =
  | 'Important'
  | 'Essentials'
  | 'Clothing'
  | 'Shoes'
  | 'Toiletries'
  | 'Electronics'
  | 'Activities'
  | 'Weather';

export type PackingItemSource = 'generated' | 'important';

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
  'Essentials',
  'Clothing',
  'Shoes',
  'Toiletries',
  'Electronics',
  'Activities',
  'Weather',
] as const;
