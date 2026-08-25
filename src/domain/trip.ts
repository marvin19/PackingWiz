import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { Traveler } from '@/domain/traveler';
import type { TripWeather } from '@/domain/weather';

export type AccommodationId =
  | 'hotel'
  | 'apartment'
  | 'hostel'
  | 'camping'
  | 'friends'
  | 'other';

export type LaundryOption = 'yes' | 'no' | 'unsure';

export type TripStatus = 'upcoming' | 'past';

/** How a packing list was created — not inferred from item count. */
export type PackingMode = 'generated' | 'manual';

export interface Trip {
  id: string;
  /** User-facing trip name — distinct from destination place name. */
  name: string;
  destination: Destination;
  startDate: string;
  endDate: string;
  /** Combined trip-context tags (suggested + custom) */
  tripContext: string[];
  accommodation: AccommodationId;
  laundry: LaundryOption;
  travelers: Traveler[];
  bags: Bag[];
  note: string;
  weather: TripWeather;
  /** One or more packing lists; primary list is packingLists[0] during single-list compatibility. */
  packingLists: PackingList[];
  insights: string[];
  status: TripStatus;
  image?: string;
  /**
   * @deprecated Migration mirror of `name`. Kept in sync by normalizeTrip — do not write independently.
   */
  title: string;
  /**
   * @deprecated Migration mirror of primary PackingList.items. Kept in sync by normalizeTrip.
   */
  items: PackingItem[];
  /**
   * @deprecated Migration mirror of primary PackingList.packingMode. Kept in sync by normalizeTrip.
   */
  packingMode: PackingMode;
  /**
   * @deprecated Mirrors primary list packingMode for Supabase schema — kept in sync by normalizeTrip.
   */
  generated: boolean;
}
