import type { PackingProfile } from '@/domain/packing-profile';
import type { TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';

function profileFromListSnapshot(
  snapshot: Trip['packingLists'][number]['profileSnapshot'],
): PackingProfile {
  return {
    id: snapshot.id,
    name: snapshot.name,
    age: snapshot.age,
    birthDate: snapshot.birthDate,
    isSelf: snapshot.isSelf,
  };
}

/**
 * Build a TripDraft-shaped input from an existing Trip for per-profile generation on edit.
 *
 * Includes generation-relevant shared context: destination, dates, tripContext,
 * accommodation, laundry, bags, note, and legacy mirrors (packingProfiles, travelers).
 *
 * Excludes Trip runtime/generated fields: weather, insights, packingLists/items,
 * status, image, and trip name — those are not part of TripDraft or generator input.
 *
 * The profile being added/generated is passed separately to assemblePackingListForProfile;
 * it is intentionally not injected here.
 */
export function tripToTripDraft(trip: Trip): TripDraft {
  return {
    id: trip.id,
    destination: { ...trip.destination },
    startDate: trip.startDate,
    endDate: trip.endDate,
    tripContext: [...trip.tripContext],
    accommodation: trip.accommodation,
    laundry: trip.laundry,
    packingProfiles: trip.packingLists.map((list) => profileFromListSnapshot(list.profileSnapshot)),
    travelers: trip.travelers.map((traveler) => ({ ...traveler })),
    bags: trip.bags.map((bag) => ({ ...bag })),
    note: trip.note,
  };
}
