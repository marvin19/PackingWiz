import type { AccommodationId, LaundryOption } from '@/domain/trip';
import type { BagType } from '@/domain/bag';

export interface CatalogOption<T extends string = string> {
  id: T;
  label: string;
  icon: string;
}

/** Curated tags shown by default on the Trip Context step */
export const TRIP_CONTEXT_PRIMARY_TAGS = [
  'Vacation',
  'Business',
  'City break',
  'Beach',
  'Hiking',
  'Family trip',
  'Training',
  'Skiing',
  'Camping',
] as const;

/** Additional known tags available through Add tags */
export const TRIP_CONTEXT_EXTENDED_TAGS = [
  'Half marathon',
  'Running',
  'Cycling',
  'Wedding',
  'Nice dinners',
] as const;

export const TRIP_CONTEXT_ALL_TAGS = [
  ...TRIP_CONTEXT_PRIMARY_TAGS,
  ...TRIP_CONTEXT_EXTENDED_TAGS,
] as const;

/** @deprecated Use TRIP_CONTEXT_ALL_TAGS */
export const TRIP_CONTEXT_SUGGESTIONS = TRIP_CONTEXT_ALL_TAGS;

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
