import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { Insight } from '@/domain/insight';
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
  /**
   * @deprecated Legacy mirror populated during assembly/migration. People on committed trips
   * come from `packingLists[].profileSnapshot` — do not treat as authoritative.
   */
  travelers: Traveler[];
  bags: Bag[];
  note: string;
  weather: TripWeather;
  /** Canonical packing ownership — one list per person on the trip. */
  packingLists: PackingList[];
  /** Trip-level packing reasoning snapshot — not user-provided trip facts. */
  insights: Insight[];
  status: TripStatus;
  image?: string;
  /**
   * @deprecated Legacy mirror of `name`. Synced from canonical normalization only.
   */
  title: string;
  /**
   * @deprecated Legacy mirror of `packingLists[0].items`. Supabase flat schema only — not authoritative.
   */
  items: PackingItem[];
  /**
   * @deprecated Legacy mirror of `packingLists[0].packingMode`. Per-list mode is canonical.
   */
  packingMode: PackingMode;
  /**
   * @deprecated Legacy mirror for Supabase `generated` column — synced from primary list mode.
   */
  generated: boolean;
}
