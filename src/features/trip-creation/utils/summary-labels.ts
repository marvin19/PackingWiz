import { ACCOMMODATIONS, LAUNDRY_OPTIONS } from '@/domain/catalog';
import type { Bag } from '@/domain/bag';
import type { PackingProfile } from '@/domain/packing-profile';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { formatTripContext } from '@/features/trips/utils/trip-context-icon';
import { getPackingForSummaryLabel } from '@/domain/trip-draft-profiles';

export function getTripContextLabel(tags: string[]): string {
  return formatTripContext(tags);
}

export function getAccommodationLabel(id: AccommodationId | null): string {
  return ACCOMMODATIONS.find((entry) => entry.id === (id ?? 'hotel'))?.label ?? 'Hotel';
}

export function getLaundryLabel(id: LaundryOption | null): string {
  switch (id) {
    case 'yes':
      return 'Available';
    case 'no':
      return 'None';
    default:
      return LAUNDRY_OPTIONS.find((entry) => entry.id === 'unsure')?.label ?? 'Not sure';
  }
}

export function getPackingForLabel(profiles: PackingProfile[]): string {
  if (profiles.length === 0) {
    return 'None selected';
  }

  return getPackingForSummaryLabel(profiles);
}

export function getBagsSummaryLabel(bags: Bag[]): string {
  if (bags.length === 0) {
    return 'None added';
  }

  if (bags.length === 1) {
    return bags[0].name;
  }

  return `${bags.length} bags`;
}
