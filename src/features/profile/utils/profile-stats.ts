import type { Trip } from '@/domain/trip';
import { countAllPackedItems } from '@/domain/trip-canonical';

export type ProfileTravelStats = {
  tripsPlanned: number;
  itemsPacked: number;
};

export function profileTravelStats(trips: Trip[]): ProfileTravelStats {
  const tripsPlanned = trips.length;
  const itemsPacked = trips.reduce((sum, trip) => sum + countAllPackedItems(trip), 0);

  return { tripsPlanned, itemsPacked };
}
