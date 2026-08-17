import { ACCOMMODATIONS, LAUNDRY_OPTIONS, TRIP_TYPES } from '@/domain/catalog';
import type { AccommodationId, LaundryOption, TripTypeId } from '@/domain/trip';

export function getTripTypeLabels(typeIds: TripTypeId[]): string {
  if (typeIds.length === 0) {
    return TRIP_TYPES.find((entry) => entry.id === 'vacation')?.label ?? 'Vacation';
  }

  return typeIds
    .map((id) => TRIP_TYPES.find((entry) => entry.id === id)?.label ?? id)
    .join(', ');
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
