import { createDestinationFromText } from '@/domain/destination';
import { getTripName } from '@/domain/trip-name';
import {
  getPrimaryPackingList,
  getTripPackingItems,
  getTripPackingMode,
  patchPrimaryPackingItem,
  primaryPackingListId,
  primaryPackingProfileId,
  normalizeTrip,
  type TripLike,
} from '@/domain/trip-compatibility';
import { cloneTrip } from '@/lib/clone-trip';
import {
  createMultiListFixtureTrip,
  multiListFixtureSecondaryListId,
} from '@/mocks/multi-list-fixture';
import { mockSeedTrips } from '@/mocks/seed-trips';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyTripNameWhitespaceFallback(): void {
  assert(
    getTripName({ name: '   ', title: 'Lisbon' }) === 'Lisbon',
    'whitespace-only name falls back to title',
  );
  assert(
    getTripName({ name: 'Tokyo & Kyoto', title: 'Other' }) === 'Tokyo & Kyoto',
    'normal name behavior unchanged',
  );
}

function verifySeedTrips(): void {
  for (const trip of mockSeedTrips) {
    assert(trip.packingLists.length === 1, `${trip.id}: expected one packing list`);
    assert(
      trip.packingLists[0].id === primaryPackingListId(trip.id),
      `${trip.id}: stable primary list id`,
    );
    assert(
      trip.packingLists[0].packingProfileId === primaryPackingProfileId(trip.id),
      `${trip.id}: stable profile id`,
    );
    assert(
      trip.packingLists[0].profileSnapshot.name === 'Me',
      `${trip.id}: explicit self profile snapshot`,
    );
    assert(
      trip.packingLists[0].profileSnapshot.isSelf === true,
      `${trip.id}: self profile flag`,
    );
    assert(
      getTripPackingItems(trip).length === trip.items.length,
      `${trip.id}: legacy items mirror primary list`,
    );
    assert(
      getTripPackingMode(trip) === trip.packingMode,
      `${trip.id}: legacy packingMode mirror`,
    );
    assert(trip.name === trip.title, `${trip.id}: name/title mirror`);
  }
}

function verifyCloneRoundTrip(): void {
  const source = mockSeedTrips[0];
  const cloned = cloneTrip(source);
  const renormalized = normalizeTrip(cloned);

  assert(renormalized.name === source.name, 'clone preserves name');
  assert(
    renormalized.packingLists[0].id === source.packingLists[0].id,
    'clone preserves list id',
  );
  assert(
    renormalized.packingLists[0].profileSnapshot.id ===
      source.packingLists[0].profileSnapshot.id,
    'clone preserves profile snapshot id',
  );
  assert(
    getTripPackingMode(renormalized) === getTripPackingMode(source),
    'clone preserves packing mode',
  );
  assert(
    getTripPackingItems(renormalized).length === getTripPackingItems(source).length,
    'clone preserves item count',
  );
}

function verifyLegacyTripNormalization(): void {
  const legacyTrip: TripLike = {
    id: 'legacy-trip',
    title: 'Legacy Trip',
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2026-01-01',
    endDate: '2026-01-05',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Mild',
      detail: '',
      high: 20,
      low: 10,
    },
    items: [
      {
        id: 'legacy-item-1',
        name: 'Passport',
        quantity: 1,
        category: 'Essentials',
        packed: false,
        needToBuy: false,
        assignedTo: null,
      },
    ],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  const cloned = cloneTrip(legacyTrip);
  assert(cloned.packingLists.length === 1, 'legacy trip clone produces nested primary list');
  assert(
    cloned.packingLists[0].id === primaryPackingListId('legacy-trip'),
    'legacy trip clone uses stable primary list id',
  );
  assert(getTripPackingItems(cloned).length === 1, 'legacy trip items preserved through clone');
}

async function verifyLegacyTripThroughMockRepository(): Promise<void> {
  const legacyTrip: TripLike = {
    id: 'legacy-repo-trip',
    title: 'Legacy Repo Trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-02-01',
    endDate: '2026-02-05',
    tripContext: ['City break'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Cold',
      detail: '',
      high: 0,
      low: -5,
    },
    items: [
      {
        id: 'legacy-repo-item',
        name: 'Coat',
        quantity: 1,
        category: 'Clothing',
        packed: false,
        needToBuy: false,
        assignedTo: null,
      },
    ],
    insights: [],
    packingMode: 'manual',
    generated: false,
    status: 'upcoming',
  };

  const repo = new MockTripRepository([legacyTrip]);
  const loaded = await repo.getById('legacy-repo-trip');
  assert(loaded !== null, 'legacy trip loads from mock repository');
  const normalized = loaded!;

  assert(normalized.packingLists.length === 1, 'mock repository normalizes legacy trip');
  assert(
    normalized.packingLists[0].id === primaryPackingListId('legacy-repo-trip'),
    'mock repository preserves stable primary list id',
  );
  assert(getTripPackingItems(normalized).length === 1, 'mock repository preserves legacy items');
}

function verifyMultiListPreservation(): void {
  const fixture = createMultiListFixtureTrip();
  const secondaryBefore = fixture.packingLists[1];

  const updated = patchPrimaryPackingItem(fixture, 'fixture-item-primary', { packed: true });

  assert(updated.packingLists.length === 2, 'multi-list trip keeps both lists');
  assert(
    updated.packingLists[1].id === multiListFixtureSecondaryListId,
    'secondary list id preserved',
  );
  assert(
    updated.packingLists[1].items.length === secondaryBefore.items.length,
    'secondary list items preserved',
  );
  assert(
    updated.packingLists[1].items[0].packed === secondaryBefore.items[0].packed,
    'secondary list item state untouched',
  );
  assert(
    getPrimaryPackingList(updated).items[0].packed === true,
    'primary list mutation applied',
  );
}

async function verifyMockRepository(): Promise<void> {
  const repo = new MockTripRepository(mockSeedTrips);
  const loaded = (await repo.getAll())[0];
  const itemId = getTripPackingItems(loaded)[0].id;

  await repo.updatePackingItem(loaded.id, itemId, {
    packed: !getTripPackingItems(loaded)[0].packed,
  });
  const reread = await repo.getById(loaded.id);
  assert(reread !== null, 'repository reread succeeds');
  const saved = reread!;
  assert(
    saved.packingLists[0].id === primaryPackingListId(loaded.id),
    'repository preserves list id after mutation',
  );
}

/** MP1 regression checks for seeds, clone, legacy ingress, multi-list safety, and mock repository. */
export async function runMp1InvariantChecks(): Promise<void> {
  verifyTripNameWhitespaceFallback();
  verifySeedTrips();
  verifyLegacyTripNormalization();
  verifyCloneRoundTrip();
  verifyMultiListPreservation();
  await verifyLegacyTripThroughMockRepository();
  await verifyMockRepository();
}
