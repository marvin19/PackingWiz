import type { Trip } from '@/domain/trip';

export function packingStats(trip: Trip | null): { packed: number; total: number; pct: number } {
  if (!trip) {
    return { packed: 0, total: 0, pct: 0 };
  }

  const packed = trip.items.filter((item) => item.packed).length;
  const total = trip.items.length;
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100);

  return { packed, total, pct };
}

export function findActiveTrip(trips: Trip[], activeTripId: string | null): Trip | null {
  if (!activeTripId) {
    return null;
  }
  return trips.find((trip) => trip.id === activeTripId) ?? null;
}
