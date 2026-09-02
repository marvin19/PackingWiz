import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { snapshotPackingListsState } from '@/domain/trip-edit';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';
import {
  assertMultiListReusePersistenceSupported,
  reuseTrip,
} from '@/services/trip-reuse-orchestration';
import { SUPABASE_MULTI_LIST_SAVE_ERROR } from '@/repositories/trips/supabase-trip-save-guard';

const SOURCE_TRIP_ID = 'trip-reuse-orchestration';

function makeItem(id: string, name: string, packed = false): PackingItem {
  return {
    id,
    name,
    quantity: 1,
    category: 'Clothing',
    packed,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
  };
}

function createSourceTrip(): Trip {
  const meListId = primaryPackingListId(SOURCE_TRIP_ID);
  const emilieListId = `${SOURCE_TRIP_ID}-list-emilie`;

  const input: TripLike = {
    id: SOURCE_TRIP_ID,
    name: 'Orchestration source',
    title: 'Orchestration source',
    destination: createDestinationFromText('Oslo'),
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Old', detail: '', high: 20, low: 10 },
    insights: [{ id: 'old', category: 'weather', title: 'Old', body: 'Old insight' }],
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${SOURCE_TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${SOURCE_TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [makeItem('item-me', 'Shirt', true)],
      },
      {
        id: emilieListId,
        packingProfileId: `${SOURCE_TRIP_ID}-profile-emilie`,
        profileSnapshot: {
          id: `${SOURCE_TRIP_ID}-profile-emilie`,
          name: 'Emilie',
          isSelf: false,
        },
        packingMode: 'manual',
        items: [makeItem('item-emilie', 'Toy', true)],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
  };

  return normalizeTrip(input);
}

describe('reuseTrip orchestration', () => {
  it('persists source and new trip independently in mock repository', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const sourceBefore = snapshotPackingListsState(source);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);

    const created = await reuseTrip(
      source,
      {
        packingListIds: [meListId],
        sharedDetails: { startDate: '2026-08-01', endDate: '2026-08-05' },
        referenceDate: new Date('2026-06-01'),
      },
      { tripRepository: repository },
    );

    const allTrips = await repository.getAll();
    expect(allTrips).toHaveLength(2);
    expect(allTrips.some((trip) => trip.id === SOURCE_TRIP_ID)).toBe(true);
    expect(allTrips.some((trip) => trip.id === created.id)).toBe(true);
    expect(created.packingLists[0]?.items.every((item) => item.packed === false)).toBe(true);

    const reloadedSource = await repository.getById(SOURCE_TRIP_ID);
    expect(snapshotPackingListsState(reloadedSource!)).toEqual(sourceBefore);
  });

  it('does not leave a phantom trip when repository create fails', async () => {
    const source = createSourceTrip();
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const repository: MockTripRepository = new MockTripRepository([source]);
    const originalCreate = repository.createTrip.bind(repository);

    repository.createTrip = async () => {
      throw new Error('Persistence failed');
    };

    await expect(
      reuseTrip(
        source,
        {
          packingListIds: [meListId],
          sharedDetails: { startDate: '2026-08-01', endDate: '2026-08-05' },
          referenceDate: new Date('2026-06-01'),
        },
        { tripRepository: repository },
      ),
    ).rejects.toThrow('Persistence failed');

    repository.createTrip = originalCreate;
    expect(await repository.getAll()).toHaveLength(1);
  });

  it('documents Supabase multi-list reuse rejection contract', () => {
    const source = createSourceTrip();
    const multiListTrip = normalizeTrip({
      ...source,
      id: 'trip-multi',
      packingLists: source.packingLists.map((list, index) => ({
        ...list,
        id: `list-${index}`,
      })),
    });

    expect(() => assertMultiListReusePersistenceSupported(multiListTrip)).toThrow(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
  });
});
