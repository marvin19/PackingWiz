export type PackingCategory =
  | 'Essentials'
  | 'Clothing'
  | 'Shoes'
  | 'Toiletries'
  | 'Electronics'
  | 'Activities'
  | 'Weather';

export interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  category: PackingCategory;
  packed: boolean;
  needToBuy: boolean;
  /** Traveler id, or null when shared / unassigned */
  assignedTo: string | null;
  note?: string;
}

export const PACKING_CATEGORY_ORDER: readonly PackingCategory[] = [
  'Essentials',
  'Clothing',
  'Shoes',
  'Toiletries',
  'Electronics',
  'Activities',
  'Weather',
] as const;
