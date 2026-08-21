export type BagType =
  | 'checked'
  | 'carryon'
  | 'backpack'
  | 'duffel'
  | 'personal'
  | 'other';

export interface Bag {
  id: string;
  name: string;
  type: BagType;
  /** Traveler id, or null for a shared bag */
  ownerId: string | null;
}
