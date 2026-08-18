import { PACKING_CATEGORY_ORDER, type PackingCategory } from '@/domain/packing-item';
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

export function shoppingCount(trip: Trip | null): number {
  if (!trip) {
    return 0;
  }

  return trip.items.filter((item) => item.needToBuy).length;
}

export type CategoryProgress = {
  category: PackingCategory;
  packed: number;
  total: number;
  pct: number;
};

export function categoryBreakdown(trip: Trip): CategoryProgress[] {
  return PACKING_CATEGORY_ORDER.map((category) => {
    const items = trip.items.filter((item) => item.category === category);
    const packed = items.filter((item) => item.packed).length;
    const total = items.length;

    return {
      category,
      packed,
      total,
      pct: total === 0 ? 0 : Math.round((packed / total) * 100),
    };
  }).filter((entry) => entry.total > 0);
}

export type TravelerProgress = {
  id: string;
  name: string;
  sub: string;
  shared: boolean;
  packed: number;
  total: number;
  pct: number;
};

export function travelerBreakdown(trip: Trip): TravelerProgress[] {
  const buckets: TravelerProgress[] = [
    ...trip.travelers.map((traveler) => {
      const items = trip.items.filter((item) => item.assignedTo === traveler.id);
      const packed = items.filter((item) => item.packed).length;
      const total = items.length;

      return {
        id: traveler.id,
        name: traveler.name,
        sub: traveler.role,
        shared: false,
        packed,
        total,
        pct: total === 0 ? 0 : Math.round((packed / total) * 100),
      };
    }),
    (() => {
      const items = trip.items.filter((item) => !item.assignedTo);
      const packed = items.filter((item) => item.packed).length;
      const total = items.length;

      return {
        id: 'shared',
        name: 'Shared',
        sub: 'Everyone',
        shared: true,
        packed,
        total,
        pct: total === 0 ? 0 : Math.round((packed / total) * 100),
      };
    })(),
  ];

  return buckets.filter((entry) => entry.total > 0);
}

export function findActiveTrip(trips: Trip[], activeTripId: string | null): Trip | null {
  if (!activeTripId) {
    return null;
  }
  return trips.find((trip) => trip.id === activeTripId) ?? null;
}
