import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { normalizeTrip } from '@/domain/trip-compatibility';

/** Deep-enough clone for trip snapshots and repository storage. */
export function clonePackingItem(item: PackingItem): PackingItem {
  return { ...item };
}

export function cloneTrip(trip: Trip): Trip {
  return normalizeTrip({
    ...trip,
    destination: { ...trip.destination },
    tripContext: [...trip.tripContext],
    travelers: trip.travelers.map((traveler) => ({ ...traveler })),
    bags: trip.bags.map((bag) => ({ ...bag })),
    packingLists: trip.packingLists.map((list) => ({
      ...list,
      profileSnapshot: { ...list.profileSnapshot },
      items: list.items.map(clonePackingItem),
    })),
    items: trip.items.map(clonePackingItem),
    weather: { ...trip.weather, days: trip.weather.days?.map((day) => ({ ...day })) },
    insights: [...trip.insights],
  });
}

export function cloneTrips(trips: Trip[]): Trip[] {
  return trips.map((trip) => cloneTrip(trip));
}
