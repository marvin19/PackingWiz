import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import { createDestinationFromText } from '@/domain/destination';
import { packingStatsForList } from '@/domain/packing-stats';
import { resolveTripPackEntry } from '@/domain/trip-pack-entry';
import { getTripName } from '@/domain/trip-name';
import {
  appendPackingListItem,
  findPackingListById,
  getPrimaryPackingList,
  getTripPackingItems,
  getTripPackingMode,
  patchPackingListItem,
  patchPrimaryPackingItem,
  primaryPackingListId,
  primaryPackingProfileId,
  normalizeTrip,
  removePackingListItem,
  type TripLike,
} from '@/domain/trip-compatibility';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import {
  createDraftProfile,
  normalizeTripDraft,
  patchDraftPackingProfiles,
} from '@/domain/trip-draft-profiles';
import { packingListIdForTripProfile, uniquePackingProfilesById } from '@/domain/trip-packing-lists';
import { cloneTrip } from '@/lib/clone-trip';
import {
  createMultiListFixtureTrip,
  multiListFixtureSecondaryListId,
} from '@/mocks/multi-list-fixture';
import { mockSeedTrips } from '@/mocks/seed-trips';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyDraftProfileIdUniqueness(): void {
  const first = createDraftProfile('Alex', 10);
  const second = createDraftProfile('Blake', 12);

  assert(first.id !== second.id, 'rapid draft profile creation produces distinct ids');
  assert(
    uniquePackingProfilesById([first, second]).length === 2,
    'profile dedupe keeps two rapidly created profiles with distinct ids',
  );
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

function createAssemblyTestDraft(): TripDraft {
  const base = createEmptyTripDraft();
  const emilie = createDraftProfile('Emilie', 2);

  return normalizeTripDraft({
    ...base,
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    ...patchDraftPackingProfiles(base, [base.packingProfiles[0], emilie]),
  });
}

async function verifyMultiProfileTripAssembly(): Promise<void> {
  const draft = createAssemblyTestDraft();
  const importantItems = [{ id: 'imp-keys', name: 'Keys', quantity: 1, enabled: true }];
  const services = {
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  };

  const soloBase = createAssemblyTestDraft();
  const soloDraft = normalizeTripDraft({
    ...soloBase,
    ...patchDraftPackingProfiles(soloBase, [soloBase.packingProfiles[0]]),
  });
  const soloTrip = await assembleTripFromDraft(soloDraft, services, { packingMode: 'generated' });
  assert(soloTrip.packingLists.length === 1, 'single profile creates one list');

  const generated = await assembleTripFromDraft(draft, services, {
    packingMode: 'generated',
    importantItems,
  });

  assert(generated.packingLists.length === 2, 'two profiles create two packing lists');
  assert(generated.packingLists[0].profileSnapshot.isSelf === true, 'primary list is self');
  assert(generated.packingLists[1].profileSnapshot.name === 'Emilie', 'secondary snapshot name');
  assert(
    generated.packingLists[0].id === packingListIdForTripProfile(generated.id, generated.packingLists[0].profileSnapshot),
    'self list uses primary list id',
  );
  assert(
    generated.packingLists[0].id !== generated.packingLists[1].id,
    'packing list ids are distinct',
  );
  assert(
    generated.packingLists.every((list) => list.packingMode === 'generated'),
    'generated mode on each list',
  );
  assert(
    generated.packingLists[1].items.some((item) => item.name === 'Child pajamas'),
    'child profile receives person-specific generated item',
  );
  assert(
    generated.packingLists[0].items.some((item) => item.category === 'Important'),
    'temporary Important rule: self list receives Important items',
  );
  assert(
    !generated.packingLists[1].items.some((item) => item.category === 'Important'),
    'temporary Important rule: non-self list has no Important items',
  );
  assert(generated.weather.summary.length > 0, 'weather is trip-level');

  const manual = await assembleTripFromDraft(draft, services, {
    packingMode: 'manual',
    importantItems,
  });
  assert(manual.packingLists.length === 2, 'manual mode creates two lists');
  assert(
    manual.packingLists.every((list) => list.packingMode === 'manual'),
    'manual mode stored on each list',
  );
  assert(manual.packingLists[1].items.length === 0, 'manual non-self list starts empty');

  const repo = new MockTripRepository();
  const saved = await repo.createTrip(generated);
  assert(saved.packingLists.length === 2, 'mock repository preserves all lists on create');
  const cloned = cloneTrip(saved);
  assert(cloned.packingLists.length === 2, 'clone preserves all lists');
  assert(
    cloned.packingLists[1].profileSnapshot.age === 2,
    'clone preserves secondary profile snapshot',
  );

  const secondaryBefore = saved.packingLists[1].items;
  const itemId = saved.packingLists[0].items[0]?.id;
  assert(Boolean(itemId), 'primary list has items to mutate');
  const updated = patchPrimaryPackingItem(saved, itemId!, { packed: true });
  assert(updated.packingLists[1].items.length === secondaryBefore.length, 'secondary list item count preserved');
}

async function verifyGenerationFailureAllOrNothing(): Promise<void> {
  const draft = normalizeTripDraft({
    ...createAssemblyTestDraft(),
    note: 'GENERATION_FAIL',
  });

  let failed = false;
  try {
    await assembleTripFromDraft(
      draft,
      { packingGenerator: mockPackingGenerator, weatherService: mockWeatherService },
      { packingMode: 'generated' },
    );
  } catch {
    failed = true;
  }

  assert(failed, 'generator failure prevents partial trip assembly');
}

function verifyActiveListReconciliation(): void {
  const single = mockSeedTrips[0];
  const singleResolved = reconcileActivePackingListId(single.id, null, mockSeedTrips, {
    allowPrimaryCompatibilityFallback: true,
  });
  assert(singleResolved.autoResolved === true, 'single-list trip auto-resolves active list');
  assert(
    singleResolved.activePackingListId === single.packingLists[0].id,
    'single-list trip selects its only list',
  );

  const multi = createMultiListFixtureTrip();
  const primaryId = getPrimaryPackingList(multi).id;
  const secondaryId = multi.packingLists[1].id;

  const explicitMe = reconcileActivePackingListId(multi.id, primaryId, [multi], {
    allowPrimaryCompatibilityFallback: true,
  });
  assert(explicitMe.activePackingListId === primaryId, 'explicit Me list selection preserved');

  const explicitEmilie = reconcileActivePackingListId(multi.id, secondaryId, [multi], {
    allowPrimaryCompatibilityFallback: true,
  });
  assert(
    explicitEmilie.activePackingListId === secondaryId,
    'explicit Emilie list selection preserved',
  );

  const fallback = reconcileActivePackingListId(multi.id, null, [multi], {
    allowPrimaryCompatibilityFallback: true,
  });
  assert(
    fallback.activePackingListId === primaryId,
    'multi-list Pack entry uses temporary primary compatibility fallback',
  );
  assert(fallback.selectionRequired === true, 'multi-list fallback marks selectionRequired');
  assert(
    fallback.usedPrimaryCompatibilityFallback === true,
    'multi-list fallback flagged for MP3B',
  );

  const crossTrip = reconcileActivePackingListId(single.id, secondaryId, [single], {
    allowPrimaryCompatibilityFallback: true,
  });
  assert(
    crossTrip.activePackingListId === single.packingLists[0].id,
    'invalid list id from another trip is not carried over',
  );
}

function verifyTripPackEntry(): void {
  const single = mockSeedTrips[0];
  const singleEntry = resolveTripPackEntry(single.id, null, null, mockSeedTrips);
  assert(singleEntry.destination === 'pack', 'single-list trip opens Pack directly');
  assert(
    singleEntry.activePackingListId === single.packingLists[0].id,
    'single-list trip auto-selects its only list',
  );

  const multi = createMultiListFixtureTrip();
  const primaryId = getPrimaryPackingList(multi).id;
  const secondaryId = multi.packingLists[1].id;

  const unresolved = resolveTripPackEntry(multi.id, null, null, [multi]);
  assert(unresolved.destination === 'select-list', 'multi-list unresolved entry requires picker');
  assert(unresolved.activePackingListId === null, 'multi-list unresolved entry clears active list');

  const pickEmilie = resolveTripPackEntry(multi.id, null, null, [multi], secondaryId);
  assert(pickEmilie.destination === 'pack', 'explicit Emilie selection opens Pack');
  assert(pickEmilie.activePackingListId === secondaryId, 'explicit Emilie list id resolved');

  const pickMe = resolveTripPackEntry(multi.id, null, null, [multi], primaryId);
  assert(pickMe.activePackingListId === primaryId, 'explicit Me list id resolved');

  const preserve = resolveTripPackEntry(multi.id, multi.id, secondaryId, [multi]);
  assert(
    preserve.activePackingListId === secondaryId,
    'in-trip navigation preserves valid active list without changing trip',
  );

  const crossTrip = resolveTripPackEntry(single.id, multi.id, secondaryId, [single]);
  assert(
    crossTrip.activePackingListId === single.packingLists[0].id,
    'cross-trip list id from Trip A cannot leak into Trip B',
  );

  const meStats = packingStatsForList(multi, primaryId);
  const emilieStats = packingStatsForList(multi, secondaryId);
  assert(
    meStats.total === getPrimaryPackingList(multi).items.length,
    'Me picker progress uses Me list items',
  );
  assert(
    emilieStats.total === multi.packingLists[1].items.length,
    'Emilie picker progress uses Emilie list items',
  );
}

function verifyActiveListIsolation(): void {
  const trip = createMultiListFixtureTrip();
  const primaryId = getPrimaryPackingList(trip).id;
  const secondaryId = trip.packingLists[1].id;
  const secondaryItemId = trip.packingLists[1].items[0].id;
  const primaryBefore = [...getPrimaryPackingList(trip).items];

  const toggled = patchPackingListItem(trip, secondaryId, secondaryItemId, { packed: false });
  assert(
    getPrimaryPackingList(toggled).items.every(
      (item, index) => item.packed === primaryBefore[index]?.packed,
    ),
    'toggle on secondary list leaves primary list unchanged',
  );

  const added = appendPackingListItem(toggled, secondaryId, {
    id: 'fixture-added-emilie',
    name: 'Teddy bear',
    quantity: 1,
    category: 'Essentials',
    packed: false,
    needToBuy: false,
    assignedTo: null,
  });
  assert(
    !findPackingListById(added, primaryId)?.items.some((item) => item.id === 'fixture-added-emilie'),
    'append on Emilie list does not appear on Me list',
  );

  const removed = removePackingListItem(added, secondaryId, 'fixture-added-emilie');
  assert(
    Boolean(findPackingListById(removed, secondaryId)?.items.some((item) => item.id === secondaryItemId)),
    'delete on Emilie list keeps other Emilie items',
  );
  assert(
    getPrimaryPackingList(removed).items.length === primaryBefore.length,
    'delete on Emilie list leaves Me item count unchanged',
  );
}

async function verifyActiveListRepositoryRoundTrip(): Promise<void> {
  const trip = createMultiListFixtureTrip();
  const secondaryId = trip.packingLists[1].id;
  const secondaryItemId = trip.packingLists[1].items[0].id;

  const repo = new MockTripRepository([trip]);
  await repo.updatePackingItem(trip.id, secondaryItemId, { packed: false }, secondaryId);
  await repo.addPackingItem(
    trip.id,
    {
      name: 'Teddy bear',
      category: 'Essentials',
      id: 'repo-emilie-item',
    },
    secondaryId,
  );

  const reread = await repo.getById(trip.id);
  assert(reread !== null, 'multi-list trip reloads after secondary mutations');
  const saved = reread!;
  assert(saved.packingLists.length === 2, 'repository preserves secondary list');
  assert(
    saved.packingLists[1].items.some((item) => item.name === 'Teddy bear'),
    'secondary add survives repository round-trip',
  );
  assert(
    saved.packingLists[1].items.find((item) => item.id === secondaryItemId)?.packed === false,
    'secondary patch survives repository round-trip',
  );
  assert(
    packingStatsForList(saved, secondaryId).total === saved.packingLists[1].items.length,
    'list-scoped stats use active list items',
  );
}

function createCustomPrimaryListFixtureTrip(): Trip {
  const tripId = 'fixture-custom-primary';
  const customPrimaryId = 'custom-primary-list-uuid';
  const secondaryId = `${tripId}-list-secondary`;

  const input: TripLike = {
    id: tripId,
    name: 'Custom primary fixture',
    title: 'Custom primary fixture',
    destination: createDestinationFromText('Fixture', 'Nowhere'),
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
      summary: 'Fixture weather',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: [
      {
        id: customPrimaryId,
        packingProfileId: `${tripId}-profile-self`,
        profileSnapshot: {
          id: `${tripId}-profile-self`,
          name: 'Me',
          isSelf: true,
        },
        packingMode: 'generated',
        items: [
          {
            id: 'custom-primary-item',
            name: 'Custom primary item',
            quantity: 1,
            category: 'Essentials',
            packed: false,
            needToBuy: false,
            assignedTo: null,
            source: 'generated',
          },
        ],
      },
      {
        id: secondaryId,
        packingProfileId: `${tripId}-profile-emilie`,
        profileSnapshot: {
          id: `${tripId}-profile-emilie`,
          name: 'Emilie',
          isSelf: false,
        },
        packingMode: 'manual',
        items: [
          {
            id: 'custom-secondary-item',
            name: 'Secondary list item',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            source: 'generated',
          },
        ],
      },
    ],
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

async function verifyCustomPrimaryListRepositoryResolution(): Promise<void> {
  const trip = createCustomPrimaryListFixtureTrip();
  const customPrimaryId = trip.packingLists[0].id;
  const secondaryId = trip.packingLists[1].id;
  const deterministicPrimaryId = primaryPackingListId(trip.id);

  assert(
    customPrimaryId !== deterministicPrimaryId,
    'fixture uses non-deterministic primary list id',
  );

  const repo = new MockTripRepository([trip]);
  const primaryItemId = trip.packingLists[0].items[0].id;
  const before = await repo.getById(trip.id);
  assert(before !== null, 'fixture trip loads');
  const secondaryBefore = cloneTrip(before as Trip);

  await repo.updatePackingItem(trip.id, primaryItemId, { packed: true });

  const saved = await repo.getById(trip.id);
  assert(saved !== null, 'custom primary mutation succeeds');
  const updated = saved!;

  assert(
    updated.packingLists[0].id === customPrimaryId,
    'mutation targets actual primary list id',
  );
  assert(
    !updated.packingLists.some((list) => list.id === deterministicPrimaryId),
    'deterministic primary list id is not created',
  );
  assert(
    updated.packingLists[0].items.find((item) => item.id === primaryItemId)?.packed === true,
    'custom primary item mutation applied',
  );
  assert(updated.packingLists.length === 2, 'secondary list preserved');
  assert(
    updated.packingLists[1].id === secondaryId,
    'secondary list id unchanged',
  );
  assert(
    updated.packingLists[1].items[0].packed === secondaryBefore.packingLists[1].items[0].packed,
    'secondary list items unchanged',
  );

  const seedRepo = new MockTripRepository(mockSeedTrips);
  const seedTrip = (await seedRepo.getAll())[0];
  const seedItemId = getTripPackingItems(seedTrip)[0].id;
  await seedRepo.updatePackingItem(seedTrip.id, seedItemId, {
    packed: !getTripPackingItems(seedTrip)[0].packed,
  });
  const seedSaved = await seedRepo.getById(seedTrip.id);
  assert(seedSaved !== null, 'deterministic seed trip mutation still works');
  assert(
    seedSaved!.packingLists[0].id === primaryPackingListId(seedTrip.id),
    'seed trip keeps deterministic primary list id',
  );
}

async function verifyPackingItemNoteRoundTrip(): Promise<void> {
  const trip = createMultiListFixtureTrip();
  const primaryId = getPrimaryPackingList(trip).id;
  const itemId = getPrimaryPackingList(trip).items[0].id;

  const repo = new MockTripRepository([trip]);
  await repo.updatePackingItem(
    trip.id,
    itemId,
    { note: 'Green floral, beige and black' },
    primaryId,
  );

  const saved = await repo.getById(trip.id);
  assert(saved !== null, 'note mutation reloads trip');
  const item = getPrimaryPackingList(saved!).items.find((entry) => entry.id === itemId);
  assert(item?.note === 'Green floral, beige and black', 'mock repository preserves item note');

  await repo.updatePackingItem(trip.id, itemId, { note: '' }, primaryId);
  const cleared = await repo.getById(trip.id);
  const clearedItem = getPrimaryPackingList(cleared!)!.items.find((entry) => entry.id === itemId);
  assert(!clearedItem?.note, 'cleared note persists as empty');
}

async function verifyPackingItemSettingsBatchUpdate(): Promise<void> {
  const trip = createMultiListFixtureTrip();
  const primaryId = getPrimaryPackingList(trip).id;
  const itemId = getPrimaryPackingList(trip).items[0].id;

  const repo = new MockTripRepository([trip]);
  await repo.updatePackingItem(
    trip.id,
    itemId,
    {
      name: 'Updated name',
      quantity: 3,
      needToBuy: true,
      note: 'Green trainers and black loafers',
    },
    primaryId,
  );

  const saved = await repo.getById(trip.id);
  const item = getPrimaryPackingList(saved!).items.find((entry) => entry.id === itemId);
  assert(item?.name === 'Updated name', 'batch settings update preserves name');
  assert(item?.quantity === 3, 'batch settings update preserves quantity');
  assert(item?.needToBuy === true, 'batch settings update preserves needToBuy');
  assert(item?.note === 'Green trainers and black loafers', 'batch settings update preserves personal note');
}

/** MP1–MP3B regression checks for seeds, clone, legacy ingress, multi-list safety, assembly, and active list UX. */
export async function runMp1InvariantChecks(): Promise<void> {
  verifyTripNameWhitespaceFallback();
  verifyDraftProfileIdUniqueness();
  verifySeedTrips();
  verifyLegacyTripNormalization();
  verifyCloneRoundTrip();
  verifyMultiListPreservation();
  verifyActiveListReconciliation();
  verifyTripPackEntry();
  verifyActiveListIsolation();
  await verifyLegacyTripThroughMockRepository();
  await verifyMockRepository();
  await verifyMultiProfileTripAssembly();
  await verifyGenerationFailureAllOrNothing();
  await verifyActiveListRepositoryRoundTrip();
  await verifyCustomPrimaryListRepositoryResolution();
  await verifyPackingItemNoteRoundTrip();
  await verifyPackingItemSettingsBatchUpdate();
}
