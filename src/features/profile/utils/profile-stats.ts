import type { Trip } from '@/domain/trip';

export type ProfileTravelStats = {
  tripsPlanned: number;
  itemsPacked: number;
};

export function profileTravelStats(trips: Trip[]): ProfileTravelStats {
  const tripsPlanned = trips.length;
  const itemsPacked = trips.reduce(
    (sum, trip) => sum + trip.items.filter((item) => item.packed).length,
    0,
  );

  return { tripsPlanned, itemsPacked };
}
