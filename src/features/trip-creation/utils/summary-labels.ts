import { ACCOMMODATIONS, LAUNDRY_OPTIONS } from '@/domain/catalog';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { formatTripContext } from '@/features/trips/utils/trip-context-icon';

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

export function getTravelerCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}
