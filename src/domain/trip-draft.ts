import type { AccommodationId, LaundryOption, TripTypeId } from '@/domain/trip';
import type { Bag } from '@/domain/bag';
import type { Traveler } from '@/domain/traveler';

export interface TripDraft {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  types: TripTypeId[];
  activities: string[];
  accommodation: AccommodationId | null;
  laundry: LaundryOption | null;
  travelers: Traveler[];
  bags: Bag[];
  note: string;
}

export function createEmptyTripDraft(): TripDraft {
  return {
    destination: '',
    country: '',
    startDate: '',
    endDate: '',
    types: [],
    activities: [],
    accommodation: null,
    laundry: null,
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
  };
}
