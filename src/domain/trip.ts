import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { PackingItem } from '@/domain/packing-item';
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

export interface Trip {
  id: string;
  title: string;
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
  items: PackingItem[];
  insights: string[];
  generated: boolean;
  status: TripStatus;
  image?: string;
}
