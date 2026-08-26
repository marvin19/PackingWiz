import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';

export type PackingItemPatch = Partial<
  Pick<PackingItem, 'packed' | 'quantity' | 'needToBuy' | 'assignedTo' | 'name' | 'category' | 'note'>
>;

export type NewPackingItemInput = {
  name: string;
  category: PackingCategory;
  quantity?: number;
  packed?: boolean;
  needToBuy?: boolean;
  assignedTo?: string | null;
  note?: string;
  id?: string;
};

export interface TripRepository {
  getAll(): Promise<Trip[]>;
  getById(id: string): Promise<Trip | null>;
  /** Full trip upsert — primary path for mock persistence */
  save(trip: Trip): Promise<Trip>;
  /** Updates only packing items while preserving trip metadata in storage */
  updateTripPackingItems(tripId: string, items: PackingItem[]): Promise<Trip>;
  /** Atomically inserts a new trip with travelers, bags, items, weather, and insights */
  createTrip(trip: Trip): Promise<Trip>;
  delete(id: string): Promise<void>;
  updatePackingItem(
    tripId: string,
    itemId: string,
    patch: PackingItemPatch,
    packingListId?: string,
  ): Promise<PackingItem>;
  addPackingItem(
    tripId: string,
    input: NewPackingItemInput,
    packingListId?: string,
  ): Promise<PackingItem>;
  deletePackingItem(tripId: string, itemId: string, packingListId?: string): Promise<void>;
}
