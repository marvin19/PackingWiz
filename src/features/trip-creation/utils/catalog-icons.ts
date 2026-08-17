import type { AccommodationId } from '@/domain/trip';
import type { BagType } from '@/domain/bag';
import type { TripFeatherIcon } from '@/features/trips/utils/trip-type-icon';

const ACCOMMODATION_ICONS: Record<AccommodationId, TripFeatherIcon> = {
  hotel: 'home',
  apartment: 'home',
  hostel: 'layers',
  camping: 'flag',
  friends: 'heart',
  other: 'more-horizontal',
};

const BAG_ICONS: Record<BagType, TripFeatherIcon> = {
  checked: 'briefcase',
  carryon: 'briefcase',
  backpack: 'package',
  duffel: 'briefcase',
  personal: 'briefcase',
  other: 'more-horizontal',
};

export function getAccommodationIcon(id: AccommodationId): TripFeatherIcon {
  return ACCOMMODATION_ICONS[id];
}

export function getBagIcon(type: BagType): TripFeatherIcon {
  return BAG_ICONS[type];
}
