import { cloneTrip } from '@/lib/clone-trip';
import {
  getPrimaryPackingList,
  getTripPackingItems,
  getTripPackingMode,
  patchPrimaryPackingItem,
  primaryPackingListId,
  primaryPackingProfileId,
  normalizeTrip,
} from '@/domain/trip-compatibility';
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

/** MP1 regression checks for seeds, clone, multi-list safety, and mock repository. */
export async function runMp1InvariantChecks(): Promise<void> {
  verifySeedTrips();
  verifyCloneRoundTrip();
  verifyMultiListPreservation();
  await verifyMockRepository();
}
