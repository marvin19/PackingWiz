import type { AccommodationId, LaundryOption, TripTypeId } from '@/domain/trip';
import type { BagType } from '@/domain/bag';

export interface CatalogOption<T extends string = string> {
  id: T;
  label: string;
  icon: string;
}

export const TRIP_TYPES: CatalogOption<TripTypeId>[] = [
  { id: 'vacation', label: 'Vacation', icon: 'palm' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'city', label: 'City break', icon: 'building' },
  { id: 'beach', label: 'Beach', icon: 'umbrella' },
  { id: 'outdoor', label: 'Outdoor', icon: 'mountain' },
  { id: 'training', label: 'Training', icon: 'dumbbell' },
  { id: 'race', label: 'Race', icon: 'medal' },
  { id: 'ski', label: 'Ski', icon: 'snowflake' },
  { id: 'camping', label: 'Camping', icon: 'tent' },
  { id: 'family', label: 'Family', icon: 'users' },
  { id: 'other', label: 'Other', icon: 'sparkles' },
];

export const ACTIVITIES = [
  'Sightseeing',
  'Hiking',
  'Running',
  'Half marathon',
  'Gym',
  'Swimming',
  'Beach',
  'Cycling',
  'Skiing',
  'Business meetings',
  'Formal dinner',
  'Nightlife',
] as const;

export const ACCOMMODATIONS: CatalogOption<AccommodationId>[] = [
  { id: 'hotel', label: 'Hotel', icon: 'hotel' },
  { id: 'apartment', label: 'Apartment / Airbnb', icon: 'home' },
  { id: 'hostel', label: 'Hostel', icon: 'bunk' },
  { id: 'camping', label: 'Camping', icon: 'tent' },
  { id: 'friends', label: 'Friends / family', icon: 'heart' },
  { id: 'other', label: 'Other', icon: 'dots' },
];

export const LAUNDRY_OPTIONS: { id: LaundryOption; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'unsure', label: 'Not sure' },
];

export const BAG_TYPES: CatalogOption<BagType>[] = [
  { id: 'checked', label: 'Checked suitcase', icon: 'luggage' },
  { id: 'carryon', label: 'Carry-on', icon: 'luggage' },
  { id: 'backpack', label: 'Backpack', icon: 'backpack' },
  { id: 'duffel', label: 'Duffel bag', icon: 'briefcase' },
  { id: 'personal', label: 'Personal item', icon: 'briefcase' },
  { id: 'other', label: 'Other', icon: 'dots' },
];
