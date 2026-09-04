import { emptyDestination } from '@/domain/destination';
import type { PackingProfile } from '@/domain/packing-profile';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import type { Traveler } from '@/domain/traveler';
import { createUuid } from '@/lib/id';
import {
  createDefaultSelfProfile,
  profilesToTravelers,
} from '@/domain/trip-draft-profiles';

export { emptyDestination } from '@/domain/destination';

export interface TripDraft {
  /** Stable session identity for unfinished trips (MP5B). */
  id: string;
  destination: Destination;
  startDate: string;
  endDate: string;
  tripContext: string[];
  accommodation: AccommodationId | null;
  laundry: LaundryOption | null;
  /** Canonical people to pack for during trip creation (MP2A+). */
  packingProfiles: PackingProfile[];
  /**
   * Temporary compatibility mirror for bags and trip assembly until MP5.
   * Kept in sync from packingProfiles — do not treat as the list driver.
   */
  travelers: Traveler[];
  bags: Bag[];
  note: string;
}

export function createEmptyTripDraft(id: string = createUuid()): TripDraft {
  const selfProfile = createDefaultSelfProfile();

  return {
    id,
    destination: emptyDestination(),
    startDate: '',
    endDate: '',
    tripContext: [],
    accommodation: null,
    laundry: null,
    packingProfiles: [selfProfile],
    travelers: profilesToTravelers([selfProfile]),
    bags: [],
    note: '',
  };
}
