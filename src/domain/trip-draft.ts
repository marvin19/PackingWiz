import { emptyDestination } from '@/domain/destination';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { Traveler } from '@/domain/traveler';

export { emptyDestination } from '@/domain/destination';

export interface TripDraft {
  destination: Destination;
  startDate: string;
  endDate: string;
  tripContext: string[];
  accommodation: AccommodationId | null;
  laundry: LaundryOption | null;
  travelers: Traveler[];
  bags: Bag[];
  note: string;
}

export function createEmptyTripDraft(): TripDraft {
  return {
    destination: emptyDestination(),
    startDate: '',
    endDate: '',
    tripContext: [],
    accommodation: null,
    laundry: null,
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
  };
}
