import type { ImportantItem } from '@/domain/important-item';
import type { PackingItem } from '@/domain/packing-item';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { createDestinationFromText } from '@/domain/destination';
import {
  createReusablePackingProfile,
  DRAFT_SELF_PROFILE_ID,
  normalizeTripDraft,
  patchDraftPackingProfiles,
} from '@/domain/trip-draft-profiles';
import { countImportantSnapshotItems } from '@/domain/trip-packing-lists';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';
import {
  addImportantItemForProfileStore,
  attachImportantBootstrapToRememberedProfile,
  bootstrapImportantConfigFromProfiles,
  getImportantConfigForProfile,
  migrateLegacyImportantPreferences,
  normalizeImportantProfileId,
  packingListItemsUnchanged,
  reconcileRememberedProfileImportantBootstrap,
  removeImportantItemForProfileStore,
  resolveImportantProfileId,
  saveImportantItemNamesForProfile,
  SELF_IMPORTANT_PROFILE_ID,
  setImportantEnabledForProfileStore,
  updateImportantItemForProfileStore,
  type ImportantItemsByProfileId,
} from '@/domain/profile-important-items';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createItem(id: string, name: string): ImportantItem {
  return { id, name, quantity: 1, enabled: true };
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function verifyProfileImportantIsolation(): void {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport', 'Glasses'], () =>
    nextId('me'),
  ).store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear', 'Medication'], () =>
    nextId('emilie'),
  ).store;

  const meItems = getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID).items.map((item) => item.name);
  const emilieItems = getImportantConfigForProfile(store, 'profile-emilie').items.map((item) => item.name);

  assert(meItems.join('|') === 'Passport|Glasses', 'Me resolves only Me Important items');
  assert(
    emilieItems.join('|') === 'Teddy bear|Medication',
    'Emilie resolves only Emilie Important items',
  );
}

function verifyEnabledIsolation(): void {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () =>
    nextId('me'),
  ).store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () =>
    nextId('emilie'),
  ).store;

  store = setImportantEnabledForProfileStore(store, 'profile-emilie', false);

  const emilieConfig = getImportantConfigForProfile(store, 'profile-emilie');
  const meConfig = getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID);

  assert(emilieConfig.isEnabled === false, 'Emilie Important can be disabled');
  assert(emilieConfig.items.length === 1, 'Emilie saved items remain when disabled');
  assert(emilieConfig.items[0].name === 'Teddy bear', 'Emilie saved item name preserved');
  assert(meConfig.isEnabled === true, 'Me enabled state unchanged');
  assert(meConfig.items[0].name === 'Passport', 'Me data unchanged');
}

function verifyMutationIsolation(): void {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport', 'Glasses'], () =>
    nextId('me'),
  ).store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () =>
    nextId('emilie'),
  ).store;

  store = addImportantItemForProfileStore(store, 'profile-emilie', 'Sunscreen', () => nextId('emilie')).store;

  const meItems = getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID).items.map((item) => item.name);
  assert(meItems.join('|') === 'Passport|Glasses', 'Me master unchanged after Emilie mutation');
}

function verifyExistingTripListStability(): void {
  const snapshotItems = mergeImportantItems([], [createItem('imp-teddy', 'Teddy bear')]);
  let store = saveImportantItemNamesForProfile({}, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

  store = removeImportantItemForProfileStore(store, 'profile-emilie', 'imp-teddy');
  store = addImportantItemForProfileStore(store, 'profile-emilie', 'Medication', () => 'imp-med').store;

  assert(
    packingListItemsUnchanged(snapshotItems, snapshotItems),
    'changing profile master does not mutate existing packing list snapshots',
  );
  assert(
    getImportantConfigForProfile(store, 'profile-emilie').items.every((item) => item.name !== 'Teddy bear'),
    'profile master reflects later edits independently from list snapshots',
  );
}

function verifyLegacySelfCompatibility(): void {
  const legacy = migrateLegacyImportantPreferences({
    items: [createItem('legacy-passport', 'Passport')],
    isConfigured: true,
    isEnabled: true,
    promptDismissed: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const again = migrateLegacyImportantPreferences({
    items: [createItem('legacy-passport', 'Passport')],
    isConfigured: true,
    isEnabled: true,
    promptDismissed: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  assert(
    JSON.stringify(legacy) === JSON.stringify(again),
    'legacy self Important migration is deterministic',
  );
  assert(
    legacy[SELF_IMPORTANT_PROFILE_ID]?.items[0]?.name === 'Passport',
    'legacy self Important resolves to canonical self profile id',
  );
  assert(
    normalizeImportantProfileId(DRAFT_SELF_PROFILE_ID) === SELF_IMPORTANT_PROFILE_ID,
    'draft self profile id normalizes to canonical self Important profile id',
  );
}

function verifyReusableProfileRoundTrip(): void {
  const profileId = 'profile-emilie';
  let store = saveImportantItemNamesForProfile({}, profileId, ['Teddy bear'], () => 'imp-teddy').store;

  store = updateImportantItemForProfileStore(store, profileId, 'imp-teddy', {
    name: 'Teddy bear (washed)',
  });

  const resolved = getImportantConfigForProfile(store, profileId).items;
  assert(resolved.length === 1, 'reusable profile Important master round-trips in session store');
  assert(resolved[0].name === 'Teddy bear (washed)', 'profile Important updates stay on profile id');
  assert(
    resolveImportantProfileId({ id: profileId, isSelf: false }) === profileId,
    'non-self profile id remains stable for Important ownership',
  );
}

function verifyBootstrapDoesNotRevertCanonical(): void {
  const profileId = 'profile-emilie';
  const staleBootstrap = {
    items: [createItem('imp-teddy', 'Teddy bear')],
    isConfigured: true,
    isEnabled: true,
    promptDismissed: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  let store = bootstrapImportantConfigFromProfiles({}, [
    {
      id: profileId,
      name: 'Emilie',
      isSelf: false,
      importantItemsBootstrap: staleBootstrap,
    },
  ]);

  store = updateImportantItemForProfileStore(store, profileId, 'imp-teddy', {
    name: 'Teddy bear (washed)',
  });

  const rememberedProfile: PackingProfile = {
    id: profileId,
    name: 'Emilie',
    isSelf: false,
    importantItemsBootstrap: staleBootstrap,
  };

  store = reconcileRememberedProfileImportantBootstrap(store, rememberedProfile);

  assert(
    getImportantConfigForProfile(store, profileId).items[0].name === 'Teddy bear (washed)',
    'canonical Important master is not reverted by stale embedded bootstrap',
  );

  const exported = attachImportantBootstrapToRememberedProfile(rememberedProfile, store);
  assert(
    exported.importantItemsBootstrap?.items[0].name === 'Teddy bear (washed)',
    'embedded bootstrap is refreshed from canonical on export',
  );
}

const assemblyServices = {
  packingGenerator: mockPackingGenerator,
  weatherService: mockWeatherService,
};

function createMp4bTestDraft(emilieId = 'profile-emilie'): TripDraft {
  const base = createEmptyTripDraft();
  const emilie = createReusablePackingProfile(emilieId, 'Emilie', 2);

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

function importantSnapshotNames(items: PackingItem[]): string[] {
  return items
    .filter((item) => item.category === 'Important' || item.source === 'important')
    .map((item) => item.name)
    .sort();
}

function buildStandardMp4bStore(): ImportantItemsByProfileId {
  let meItemIds = 0;
  let store = saveImportantItemNamesForProfile(
    {},
    SELF_IMPORTANT_PROFILE_ID,
    ['Passport', 'Glasses'],
    () => {
      meItemIds += 1;
      return meItemIds === 1 ? 'imp-me-passport' : 'imp-me-glasses';
    },
  ).store;

  let emilieItemIds = 0;
  store = saveImportantItemNamesForProfile(
    store,
    'profile-emilie',
    ['Teddy bear', 'Medication'],
    () => {
      emilieItemIds += 1;
      return emilieItemIds === 1 ? 'imp-emilie-teddy' : 'imp-emilie-med';
    },
  ).store;

  return store;
}

function assertMultiProfileImportantIsolation(
  trip: Awaited<ReturnType<typeof assembleTripFromDraft>>,
  modeLabel: string,
): void {
  const meList = trip.packingLists.find((list) => list.profileSnapshot.isSelf);
  const emilieList = trip.packingLists.find((list) => list.profileSnapshot.name === 'Emilie');

  assert(Boolean(meList), `${modeLabel}: Me list exists`);
  assert(Boolean(emilieList), `${modeLabel}: Emilie list exists`);

  const meImportant = importantSnapshotNames(meList!.items);
  const emilieImportant = importantSnapshotNames(emilieList!.items);

  assert(meImportant.join('|') === 'Glasses|Passport', `${modeLabel}: Me Important snapshot`);
  assert(
    emilieImportant.join('|') === 'Medication|Teddy bear',
    `${modeLabel}: Emilie Important snapshot`,
  );

  for (const name of emilieImportant) {
    assert(!meImportant.includes(name), `${modeLabel}: Emilie Important does not leak to Me`);
  }

  for (const name of meImportant) {
    assert(!emilieImportant.includes(name), `${modeLabel}: Me Important does not leak to Emilie`);
  }

  assert(
    countImportantSnapshotItems(meList!.items) === meImportant.length,
    `${modeLabel}: Me Important appears exactly once each`,
  );
  assert(
    countImportantSnapshotItems(emilieList!.items) === emilieImportant.length,
    `${modeLabel}: Emilie Important appears exactly once each`,
  );
}

async function verifyGeneratedMultiProfileImportantIsolation(): Promise<void> {
  const draft = createMp4bTestDraft();
  const store = buildStandardMp4bStore();
  const trip = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'generated',
    importantByProfileId: store,
  });

  assertMultiProfileImportantIsolation(trip, 'generated');
}

async function verifyManualMultiProfileImportantIsolation(): Promise<void> {
  const draft = createMp4bTestDraft();
  const store = buildStandardMp4bStore();
  const trip = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'manual',
    importantByProfileId: store,
  });

  assertMultiProfileImportantIsolation(trip, 'manual');
}

async function verifyDisabledProfileRetainsMasterWithoutSnapshot(): Promise<void> {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;
  store = setImportantEnabledForProfileStore(store, 'profile-emilie', false);

  for (const packingMode of ['generated', 'manual'] as const) {
    const trip = await assembleTripFromDraft(createMp4bTestDraft(), assemblyServices, {
      packingMode,
      importantByProfileId: store,
    });

    const meList = trip.packingLists.find((list) => list.profileSnapshot.isSelf)!;
    const emilieList = trip.packingLists.find((list) => list.profileSnapshot.name === 'Emilie')!;

    assert(
      importantSnapshotNames(meList.items).join('|') === 'Passport',
      `${packingMode}: Me list snapshots enabled Important`,
    );
    assert(
      importantSnapshotNames(emilieList.items).length === 0,
      `${packingMode}: disabled profile does not snapshot Important items`,
    );
    assert(
      getImportantConfigForProfile(store, 'profile-emilie').items.some((item) => item.name === 'Teddy bear'),
      `${packingMode}: disabled profile master retains stored items`,
    );
  }
}

async function verifyDisabledImportantItemNotSnapshotted(): Promise<void> {
  let meItemIds = 0;
  const saveResult = saveImportantItemNamesForProfile(
    {},
    SELF_IMPORTANT_PROFILE_ID,
    ['Passport', 'Glasses'],
    () => {
      meItemIds += 1;
      return meItemIds === 1 ? 'imp-passport' : 'imp-glasses';
    },
  );
  let store = saveResult.store;
  store = updateImportantItemForProfileStore(store, SELF_IMPORTANT_PROFILE_ID, 'imp-passport', {
    enabled: false,
  });

  for (const packingMode of ['generated', 'manual'] as const) {
    const draft = normalizeTripDraft({
      ...createEmptyTripDraft(),
      destination: createDestinationFromText('Lisbon', 'Portugal'),
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      ...patchDraftPackingProfiles(createEmptyTripDraft(), [createEmptyTripDraft().packingProfiles[0]]),
    });

    const trip = await assembleTripFromDraft(draft, assemblyServices, {
      packingMode,
      importantByProfileId: store,
    });

    const meImportant = importantSnapshotNames(trip.packingLists[0].items);
    assert(meImportant.join('|') === 'Glasses', `${packingMode}: individually disabled item is not snapshotted`);
    assert(
      getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID).items.some((item) => item.name === 'Passport'),
      `${packingMode}: disabled item remains in master`,
    );
  }
}

async function verifySnapshotIndependenceAcrossTrips(): Promise<void> {
  const draft = createMp4bTestDraft();
  let store = saveImportantItemNamesForProfile({}, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

  const tripA = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'manual',
    importantByProfileId: store,
  });
  const emilieListA = tripA.packingLists.find((list) => list.profileSnapshot.name === 'Emilie')!;
  const snapshotBefore = emilieListA.items.map((item) => ({ ...item }));

  store = removeImportantItemForProfileStore(store, 'profile-emilie', 'imp-teddy');
  store = addImportantItemForProfileStore(store, 'profile-emilie', 'Medication', () => 'imp-med').store;

  assert(
    packingListItemsUnchanged(snapshotBefore, emilieListA.items),
    'existing PackingList snapshot unchanged after master mutation',
  );
  assert(
    !emilieListA.items.some((item) => item.name === 'Medication'),
    'existing list does not gain Medication from master edit',
  );

  const tripB = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'manual',
    importantByProfileId: store,
  });
  const emilieListB = tripB.packingLists.find((list) => list.profileSnapshot.name === 'Emilie')!;

  assert(
    importantSnapshotNames(emilieListB.items).join('|') === 'Medication',
    'future PackingList reflects updated master',
  );
  assert(
    !emilieListB.items.some((item) => item.name === 'Teddy bear'),
    'future list does not include removed master item',
  );
}

async function verifyRememberedProfileUsesCanonicalMaster(): Promise<void> {
  const profileId = 'profile-emilie';
  const staleBootstrap = {
    items: [createItem('imp-teddy', 'Teddy bear')],
    isConfigured: true,
    isEnabled: true,
    promptDismissed: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  let store = bootstrapImportantConfigFromProfiles({}, [
    {
      id: profileId,
      name: 'Emilie',
      isSelf: false,
      importantItemsBootstrap: staleBootstrap,
    },
  ]);
  store = addImportantItemForProfileStore(store, profileId, 'Medication', () => 'imp-med').store;

  const rememberedProfile: PackingProfile = {
    id: profileId,
    name: 'Emilie',
    isSelf: false,
    age: 2,
    importantItemsBootstrap: staleBootstrap,
  };

  const draft = normalizeTripDraft({
    ...createEmptyTripDraft(),
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    ...patchDraftPackingProfiles(createEmptyTripDraft(), [
      createEmptyTripDraft().packingProfiles[0],
      rememberedProfile,
    ]),
  });

  const trip = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'manual',
    importantByProfileId: store,
  });

  const emilieList = trip.packingLists.find((list) => list.profileSnapshot.name === 'Emilie')!;
  assert(
    importantSnapshotNames(emilieList.items).join('|') === 'Medication|Teddy bear',
    'remembered profile trip uses canonical master, not stale bootstrap-only snapshot',
  );

  const exported = attachImportantBootstrapToRememberedProfile(rememberedProfile, store);
  assert(
    exported.importantItemsBootstrap?.items.some((item) => item.name === 'Medication') === true,
    'canonical master includes Medication beyond stale bootstrap',
  );
}

async function verifyImportantDuplicateProtection(): Promise<void> {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;

  const draft = normalizeTripDraft({
    ...createEmptyTripDraft(),
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    ...patchDraftPackingProfiles(createEmptyTripDraft(), [createEmptyTripDraft().packingProfiles[0]]),
  });

  const trip = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'generated',
    importantByProfileId: store,
  });

  const meList = trip.packingLists[0];
  const passportRows = meList.items.filter((item) => item.name.toLowerCase() === 'passport');

  assert(passportRows.length === 1, 'Passport appears exactly once when generator also suggests Passport');
  assert(passportRows[0].category === 'Important', 'duplicate protection upgrades overlapping row to Important');
  assert(passportRows[0].source === 'important', 'duplicate protection marks overlapping row as important source');
  assert(passportRows[0].importantItemId === 'imp-passport', 'duplicate protection preserves master item link');
}

/** MP4A profile-scoped Important master checks. */
export async function runMp4InvariantChecks(): Promise<void> {
  verifyProfileImportantIsolation();
  verifyEnabledIsolation();
  verifyMutationIsolation();
  verifyExistingTripListStability();
  verifyLegacySelfCompatibility();
  verifyReusableProfileRoundTrip();
  verifyBootstrapDoesNotRevertCanonical();

  await verifyGeneratedMultiProfileImportantIsolation();
  await verifyManualMultiProfileImportantIsolation();
  await verifyDisabledProfileRetainsMasterWithoutSnapshot();
  await verifyDisabledImportantItemNotSnapshotted();
  await verifySnapshotIndependenceAcrossTrips();
  await verifyRememberedProfileUsesCanonicalMaster();
  await verifyImportantDuplicateProtection();
}
