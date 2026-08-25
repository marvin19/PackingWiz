import type { Trip } from '@/domain/trip';
import { getTripPackingItems } from '@/domain/trip-compatibility';

export type ProfileTravelStats = {
  tripsPlanned: number;
  itemsPacked: number;
};

export function profileTravelStats(trips: Trip[]): ProfileTravelStats {
  const tripsPlanned = trips.length;
  const itemsPacked = trips.reduce(
    (sum, trip) => sum + getTripPackingItems(trip).filter((item) => item.packed).length,
    0,
  );

  return { tripsPlanned, itemsPacked };
}
