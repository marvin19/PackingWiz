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
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
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

/** MP1/MP2B regression checks for seeds, clone, legacy ingress, multi-list safety, and assembly. */
export async function runMp1InvariantChecks(): Promise<void> {
  verifyTripNameWhitespaceFallback();
  verifyDraftProfileIdUniqueness();
  verifySeedTrips();
  verifyLegacyTripNormalization();
  verifyCloneRoundTrip();
  verifyMultiListPreservation();
  await verifyLegacyTripThroughMockRepository();
  await verifyMockRepository();
  await verifyMultiProfileTripAssembly();
  await verifyGenerationFailureAllOrNothing();
}
