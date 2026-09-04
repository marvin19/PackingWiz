import { createDestinationFromText } from '@/domain/destination';
import { packingStatsForTrip } from '@/domain/packing-stats';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { snapshotPackingListsState } from '@/domain/trip-edit';
import { buildReusedTrip } from '@/domain/trip-reuse';
import { emptyTripWeather } from '@/domain/weather';
import { cloneTrip } from '@/lib/clone-trip';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { reuseTrip } from '@/services/trip-reuse-orchestration';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createFixtureTrip(id: string) {
  const input: TripLike = {
    id,
    name: 'Fixture reuse',
    title: 'Fixture reuse',
    destination: createDestinationFromText('Bergen'),
    startDate: '2025-05-01',
    endDate: '2025-05-05',
    tripContext: ['Hiking'],
    accommodation: 'camping',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Rainy', detail: 'Old', high: 12, low: 4 },
    insights: [{ id: 'insight', category: 'weather', title: 'Rain', body: 'Bring shell' }],
    packingLists: [
      {
        id: primaryPackingListId(id),
        packingProfileId: `${id}-profile-self`,
        profileSnapshot: { id: `${id}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: `${id}-item-important`,
            name: 'Keys',
            quantity: 1,
            category: 'Important',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            source: 'important',
            importantItemId: 'imp-keys-master',
          },
          {
            id: `${id}-item-generated`,
            name: 'Jacket',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: true,
            assignedTo: null,
            source: 'generated',
            note: 'Waterproof',
          },
        ],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
  };

  return normalizeTrip(input);
}

async function verifyReuseCreatesIndependentOwnership(): Promise<void> {
  const source = createFixtureTrip('trip-mp5d-source');
  const sourceSnapshot = JSON.stringify(cloneTrip(source));
  const listId = primaryPackingListId(source.id);

  const reused = buildReusedTrip({
    sourceTrip: source,
    packingListIds: [listId],
    sharedDetails: { startDate: '2026-07-01', endDate: '2026-07-05' },
    referenceDate: new Date('2026-06-01'),
  });

  assert(reused.id !== source.id, 'reuse creates a new trip id');
  assert(reused.packingLists[0]?.id !== listId, 'reuse creates a new packing list id');
  assert(
    reused.packingLists[0]?.items.every((item) => !source.packingLists[0]?.items.some((src) => src.id === item.id)),
    'reuse creates fresh packing item ids',
  );
  assert(JSON.stringify(cloneTrip(source)) === sourceSnapshot, 'source trip remains unchanged');
  assert(packingStatsForTrip(reused).packed === 0, 'reused trip starts with zero packed items');
  assert(reused.weather.summary === emptyTripWeather().summary, 'weather is not copied');
  assert(reused.insights.length === 0, 'insights are not copied');

  const important = reused.packingLists[0]?.items.find((item) => item.source === 'important');
  assert(important?.importantItemId === 'imp-keys-master', 'Important master link survives reuse');
}

async function verifyMockRepositoryCoexistence(): Promise<void> {
  const source = createFixtureTrip('trip-mp5d-repo');
  const repository = new MockTripRepository([source]);
  const before = snapshotPackingListsState(source);

  const created = await reuseTrip(
    source,
    {
      packingListIds: [primaryPackingListId(source.id)],
      sharedDetails: { startDate: '2026-08-01', endDate: '2026-08-04' },
      referenceDate: new Date('2026-06-01'),
    },
    { tripRepository: repository, packingGenerator: mockPackingGenerator },
  );

  const all = await repository.getAll();
  assert(all.length === 2, 'source and reused trip coexist');
  const reloadedSource = await repository.getById(source.id);
  assert(
    JSON.stringify(snapshotPackingListsState(reloadedSource!)) === JSON.stringify(before),
    'source aggregate unchanged in repository',
  );
  assert(created.id !== source.id, 'created trip is independent');
}

export async function runMp5dInvariantChecks(): Promise<void> {
  await verifyReuseCreatesIndependentOwnership();
  await verifyMockRepositoryCoexistence();
}
