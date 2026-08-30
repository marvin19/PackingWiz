import type { PackingItem } from '@/domain/packing-item';
import { packingStatsForList, packingStatsForTrip } from '@/domain/packing-stats';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';

function createProgressItems(count: number, packedCount: number): PackingItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    name: `Item ${index + 1}`,
    quantity: 1,
    category: 'Essentials' as const,
    packed: index < packedCount,
    needToBuy: false,
    assignedTo: null,
    source: 'generated' as const,
  }));
}

function createMultiListTrip(): Trip {
  const meListId = 'list-me';
  const emilieListId = 'list-emilie';

  return {
    id: 'trip-progress',
    name: 'Progress trip',
    title: 'Progress trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Fixture',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: [
      {
        id: meListId,
        packingProfileId: 'profile-me',
        profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: createProgressItems(24, 1),
      },
      {
        id: emilieListId,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', isSelf: false, age: 2 },
        packingMode: 'generated',
        items: createProgressItems(23, 2),
      },
    ],
    items: createProgressItems(24, 1),
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };
}

describe('packingStatsForTrip', () => {
  it('aggregates packed and total counts across all PackingLists', () => {
    const trip = createMultiListTrip();
    const aggregate = packingStatsForTrip(trip);

    expect(aggregate.packed).toBe(3);
    expect(aggregate.total).toBe(47);
    expect(aggregate.pct).toBe(Math.round((3 / 47) * 100));
  });

  it('matches a single PackingList when the trip has only one list', () => {
    const trip = createMultiListTrip();
    const singleListTrip: Trip = {
      ...trip,
      packingLists: [trip.packingLists[0]],
    };

    const aggregate = packingStatsForTrip(singleListTrip);
    const meStats = packingStatsForList(singleListTrip, trip.packingLists[0].id);

    expect(aggregate.packed).toBe(meStats.packed);
    expect(aggregate.total).toBe(meStats.total);
    expect(aggregate.pct).toBe(meStats.pct);
  });
});
