import type { Bag } from '@/domain/bag';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import type { TripWeather } from '@/domain/weather';

export type TripTypeId =
  | 'vacation'
  | 'business'
  | 'city'
  | 'beach'
  | 'outdoor'
  | 'training'
  | 'race'
  | 'ski'
  | 'camping'
  | 'family'
  | 'other';

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
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  types: TripTypeId[];
  activities: string[];
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
