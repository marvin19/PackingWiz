import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';
import { saveImportantItemNamesForProfile } from '@/domain/profile-important-items';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { snapshotPackingListsState, TripEditError } from '@/domain/trip-edit';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { reuseTrip } from '@/services/trip-reuse-orchestration';

const SOURCE_TRIP_ID = 'trip-reuse-orchestration';

const simenProfile: PackingProfile = {
  id: 'profile-simen',
  name: 'Simen',
  age: 12,
  isSelf: false,
};

function makeItem(id: string, name: string, packed = false, overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id,
    name,
    quantity: 1,
    category: 'Clothing',
    packed,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
    ...overrides,
  };
}

function createSourceTrip(): Trip {
  const meListId = primaryPackingListId(SOURCE_TRIP_ID);
  const emilieListId = `${SOURCE_TRIP_ID}-list-emilie`;

  const input: TripLike = {
    id: SOURCE_TRIP_ID,
    name: 'Orchestration source',
    title: 'Orchestration source',
    destination: createDestinationFromText('Lisbon', 'Portugal'),
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
        items: [
          makeItem('item-me', 'Shirt', true),
          makeItem('item-me-important', 'Passport', false, {
            category: 'Important',
            source: 'important',
            importantItemId: 'imp-passport-source',
          }),
        ],
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

function createTrackingGenerator() {
  const calls: PackingProfile[] = [];

  const generator: PackingGenerator = {
    generate: jest.fn(async ({ profile }) => {
      calls.push(profile);
      return {
        items: [makeItem(`generated-${profile.id}`, `${profile.name} generated item`)],
      };
    }),
  };

  return { generator, calls };
}

const sharedDetails = {
  startDate: '2026-08-01',
  endDate: '2026-08-10',
};

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
        sharedDetails,
        referenceDate: new Date('2026-06-01'),
      },
      { tripRepository: repository, packingGenerator: mockPackingGenerator },
    );

    const allTrips = await repository.getAll();
    expect(allTrips).toHaveLength(2);
    expect(allTrips.some((trip) => trip.id === SOURCE_TRIP_ID)).toBe(true);
    expect(allTrips.some((trip) => trip.id === created.id)).toBe(true);
    expect(created.packingLists[0]?.items.every((item) => item.packed === false)).toBe(true);

    const reloadedSource = await repository.getById(SOURCE_TRIP_ID);
    expect(snapshotPackingListsState(reloadedSource!)).toEqual(sourceBefore);
  });

  it('copies Me and generates Simen with exactly one generator call', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const { generator, calls } = createTrackingGenerator();
    const importantByProfileId = saveImportantItemNamesForProfile(
      {},
      simenProfile.id,
      ['Simen inhaler'],
      () => 'imp-simen-inhaler',
    ).store;

    const created = await reuseTrip(
      source,
      {
        packingListIds: [meListId],
        sharedDetails,
        referenceDate: new Date('2026-06-01'),
        newTravellers: [{ profile: simenProfile, packingMode: 'generated' }],
      },
      { tripRepository: repository, packingGenerator: generator, importantByProfileId },
    );

    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([simenProfile]);
    expect(created.packingLists).toHaveLength(2);
    expect(created.packingLists[0]?.items.some((item) => item.name === 'Shirt')).toBe(true);
    expect(created.packingLists[0]?.items.some((item) => item.importantItemId === 'imp-passport-source')).toBe(
      true,
    );
    expect(created.packingLists[1]?.items.some((item) => item.importantItemId === 'imp-simen-inhaler')).toBe(
      true,
    );
  });

  it('copies Me and creates manual Simen without generator calls', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const { generator } = createTrackingGenerator();

    const created = await reuseTrip(
      source,
      {
        packingListIds: [meListId],
        sharedDetails,
        referenceDate: new Date('2026-06-01'),
        newTravellers: [{ profile: simenProfile, packingMode: 'manual' }],
      },
      { tripRepository: repository, packingGenerator: generator },
    );

    expect(generator.generate).not.toHaveBeenCalled();
    expect(created.packingLists).toHaveLength(2);
    expect(created.packingLists[1]?.packingMode).toBe('manual');
    expect(created.packingLists[1]?.items).toHaveLength(0);
  });

  it('allows all source deselected when one new traveller is planned', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const { generator } = createTrackingGenerator();

    const created = await reuseTrip(
      source,
      {
        packingListIds: [],
        sharedDetails,
        referenceDate: new Date('2026-06-01'),
        newTravellers: [{ profile: simenProfile, packingMode: 'generated' }],
      },
      { tripRepository: repository, packingGenerator: generator },
    );

    expect(created.packingLists).toHaveLength(1);
    expect(created.packingLists[0]?.profileSnapshot.name).toBe('Simen');
    expect(generator.generate).toHaveBeenCalledTimes(1);
  });

  it('calls generator once per generated new traveller', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const { generator } = createTrackingGenerator();
    const jonasProfile: PackingProfile = { id: 'profile-jonas', name: 'Jonas', age: 9, isSelf: false };

    await reuseTrip(
      source,
      {
        packingListIds: [],
        sharedDetails,
        referenceDate: new Date('2026-06-01'),
        newTravellers: [
          { profile: simenProfile, packingMode: 'generated' },
          { profile: jonasProfile, packingMode: 'generated' },
        ],
      },
      { tripRepository: repository, packingGenerator: generator },
    );

    expect(generator.generate).toHaveBeenCalledTimes(2);
  });

  it('does not persist when generator fails before repository create', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const failingGenerator: PackingGenerator = {
      generate: jest.fn(async () => {
        throw new Error('Generation failed');
      }),
    };

    await expect(
      reuseTrip(
        source,
        {
          packingListIds: [],
          sharedDetails: { ...sharedDetails, note: 'GENERATION_FAIL' },
          referenceDate: new Date('2026-06-01'),
          newTravellers: [{ profile: simenProfile, packingMode: 'generated' }],
        },
        { tripRepository: repository, packingGenerator: failingGenerator },
      ),
    ).rejects.toThrow('Generation failed');

    expect(await repository.getAll()).toHaveLength(1);
  });

  it('rejects duplicate profile in reuse plan before generator calls', async () => {
    const source = createSourceTrip();
    const repository = new MockTripRepository([source]);
    const meListId = primaryPackingListId(SOURCE_TRIP_ID);
    const { generator } = createTrackingGenerator();

    await expect(
      reuseTrip(
        source,
        {
          packingListIds: [meListId],
          sharedDetails,
          referenceDate: new Date('2026-06-01'),
          newTravellers: [{ profile: simenProfile, packingMode: 'generated' }, { profile: simenProfile, packingMode: 'manual' }],
        },
        { tripRepository: repository, packingGenerator: generator },
      ),
    ).rejects.toThrow(TripEditError);

    expect(generator.generate).not.toHaveBeenCalled();
    expect(await repository.getAll()).toHaveLength(1);
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
          sharedDetails,
          referenceDate: new Date('2026-06-01'),
        },
        { tripRepository: repository, packingGenerator: mockPackingGenerator },
      ),
    ).rejects.toThrow('Persistence failed');

    repository.createTrip = originalCreate;
    expect(await repository.getAll()).toHaveLength(1);
  });
});
