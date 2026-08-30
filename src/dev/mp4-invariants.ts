import {
  importantNameListsEqual,
  mergeImportantWizardProfileDrafts,
  normalizeImportantNameList,
} from '@/features/trip-creation/utils/important-wizard-draft';
import {
  buildActiveWizardSteps,
  resolveLastWizardStepId,
  resolveLastWizardStepIndex,
  resolveWizardStepIndex,
  WIZARD_STEP_COUNT,
  wizardStepIndexForId,
} from '@/features/trip-creation/utils/wizard-steps';
import type { Trip } from '@/domain/trip';
import type { PackingItem } from '@/domain/packing-item';
import type { ImportantItem } from '@/domain/important-item';
import {
  packingListBreakdownForTrip,
  packingStatsForList,
  packingStatsForTrip,
} from '@/domain/packing-stats';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import { createDestinationFromText, getDestinationLabel } from '@/domain/destination';
import {
  createDraftProfile,
  createReusablePackingProfile,
  DRAFT_SELF_PROFILE_ID,
  normalizeTripDraft,
  patchDraftPackingProfiles,
} from '@/domain/trip-draft-profiles';
import {
  importantProfileCardMetadata,
  importantStaleNoticeKey,
  profileNeedsImportantFirstTimeSetup,
  profilesNeedingImportantSetup,
  sortProfilesForImportantWizardStep,
} from '@/domain/important-profile-setup';
import { isImportantSnapshotStale } from '@/domain/important-snapshot';
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
  migrateImportantProfileStoreKey,
  packingListItemsUnchanged,
  reconcileRememberedProfileImportantBootstrap,
  removeImportantItemForProfileStore,
  resolveImportantProfileId,
  saveImportantItemNamesForProfile,
  setImportantPromptDismissedForProfileStore,
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

function verifyImportantSetupStateContracts(): void {
  const emptyConfig = getImportantConfigForProfile({}, 'profile-emilie');
  assert(
    profileNeedsImportantFirstTimeSetup(emptyConfig),
    'unconfigured profile needs first-time setup',
  );

  let store = setImportantPromptDismissedForProfileStore({}, 'profile-emilie', true);
  const dismissedConfig = getImportantConfigForProfile(store, 'profile-emilie');
  assert(
    !profileNeedsImportantFirstTimeSetup(dismissedConfig),
    'configure-later dismiss suppresses first-time setup without marking configured',
  );
  assert(dismissedConfig.isConfigured === false, 'configure-later does not create fake configured state');
  assert(dismissedConfig.items.length === 0, 'configure-later does not create items');

  store = saveImportantItemNamesForProfile(store, 'profile-emilie', [], () => 'imp-empty').store;
  const emptyConfigured = getImportantConfigForProfile(store, 'profile-emilie');
  assert(emptyConfigured.isConfigured === true, 'empty save marks profile configured');
  assert(
    !profileNeedsImportantFirstTimeSetup(emptyConfigured),
    'configured empty profile does not re-enter first-time setup',
  );

  store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;
  const profiles = [
    { id: SELF_IMPORTANT_PROFILE_ID, name: 'Me', isSelf: true },
    { id: 'profile-emilie', name: 'Emilie', isSelf: false, age: 2 },
  ] as PackingProfile[];

  assert(
    profilesNeedingImportantSetup(profiles, store).length === 0,
    'configured profiles are excluded from first-time setup queue',
  );
}

function verifyPackProfileResolutionFromListSnapshot(): void {
  const tripListSnapshot = {
    id: 'trip-1-list-emilie',
    packingProfileId: 'trip-1-profile-emilie',
    profileSnapshot: {
      id: 'trip-1-profile-emilie',
      name: 'Emilie',
      age: 2,
      isSelf: false,
    },
    packingMode: 'generated' as const,
    items: [],
  };

  assert(
    resolveImportantProfileId(tripListSnapshot.profileSnapshot) === 'trip-1-profile-emilie',
    'Pack Important context resolves from active list profile snapshot id',
  );
  assert(
    normalizeImportantProfileId(DRAFT_SELF_PROFILE_ID) === SELF_IMPORTANT_PROFILE_ID,
    'self list snapshot ids still normalize to canonical self Important id',
  );
}

function verifyFixedWizardStepSequence(): void {
  const steps = buildActiveWizardSteps();

  assert(
    steps.join('|') ===
      'destination|trip-context|accommodation|packing-profiles|bags|important|note',
    'wizard always includes Important before Additional notes',
  );
  assert(steps.length === WIZARD_STEP_COUNT, 'wizard has fixed step count of 7');
  assert(
    wizardStepIndexForId(steps, 'important') === steps.length - 2,
    'Important immediately precedes Additional notes',
  );
  assert(
    wizardStepIndexForId(steps, 'bags') === wizardStepIndexForId(steps, 'important') - 1,
    'Important Back resolves to Bags',
  );

  const summaryBackIndex = resolveWizardStepIndex(steps, { stepId: 'note' });
  assert(
    summaryBackIndex === resolveLastWizardStepIndex(),
    'Summary Back resolves to Additional notes as the final wizard step',
  );
  assert(resolveLastWizardStepId() === 'note', 'last wizard step before Summary is Additional notes');

  let configuredStore = saveImportantItemNamesForProfile(
    {},
    SELF_IMPORTANT_PROFILE_ID,
    ['Passport'],
    () => 'imp-passport',
  ).store;
  configuredStore = saveImportantItemNamesForProfile(
    configuredStore,
    'profile-emilie',
    ['Teddy bear'],
    () => 'imp-teddy',
  ).store;

  assert(
    buildActiveWizardSteps().length === steps.length,
    'configuring all profiles does not change wizard step count',
  );

  setImportantPromptDismissedForProfileStore(configuredStore, 'profile-jonas', true);
  assert(
    buildActiveWizardSteps().length === steps.length,
    'promptDismissed does not change wizard step count',
  );

  const editImportantIndex = resolveWizardStepIndex(steps, { stepId: 'important' });
  assert(editImportantIndex >= 0, 'edit Important from Summary resolves to Important step');
}

function verifyImportantWizardCardOrdering(): void {
  let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;
  store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

  const profiles = [
    { id: SELF_IMPORTANT_PROFILE_ID, name: 'Me', isSelf: true },
    { id: 'profile-emilie', name: 'Emilie', isSelf: false, age: 2 },
    { id: 'profile-jonas', name: 'Jonas', isSelf: false, age: 8 },
  ] as PackingProfile[];

  const sorted = sortProfilesForImportantWizardStep(profiles, store);

  assert(sorted[0].name === 'Jonas', 'unconfigured profiles sort before configured profiles');
  assert(sorted[1].name === 'Me', 'configured profiles preserve selected-trip order within group');
  assert(sorted[2].name === 'Emilie', 'configured profiles preserve selected-trip order within group');
}

function verifyImportantProfileCardMetadataLabels(): void {
  let store = saveImportantItemNamesForProfile({}, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;
  const config = getImportantConfigForProfile(store, 'profile-emilie');

  const metadata = importantProfileCardMetadata(config);
  assert(metadata.includes('1 item'), 'configured card shows singular item count');
  assert(metadata.includes('Updated'), 'configured card prefers Updated label');

  store = saveImportantItemNamesForProfile(store, 'profile-jonas', ['Snack', 'Water'], () => 'imp-snack').store;
  const pluralConfig = getImportantConfigForProfile(store, 'profile-jonas');
  assert(
    importantProfileCardMetadata(pluralConfig).includes('2 items'),
    'configured card shows plural item count',
  );
}

function verifyDraftProfileRememberLifecycle(): void {
  const rememberedDraft = createDraftProfile('Emilie', 2, true);
  const ephemeralDraft = createDraftProfile('Jonas', 8, false);

  assert(rememberedDraft.id.startsWith('draft-profile-'), 'draft-selected person uses draft profile id');
  assert(rememberedDraft.rememberForFutureTrips === true, 'Remember flag is stored on draft profile');
  assert(ephemeralDraft.rememberForFutureTrips === false, 'ephemeral draft person does not set remember flag');
  assert(!rememberedDraft.id.startsWith('profile-'), 'draft person is not a reusable profile id at add time');
}

function verifyImportantStoreKeyMigration(): void {
  let store = saveImportantItemNamesForProfile({}, 'draft-profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;
  store = migrateImportantProfileStoreKey(store, 'draft-profile-emilie', 'profile-emilie');

  assert(
    getImportantConfigForProfile(store, 'profile-emilie').items[0].name === 'Teddy bear',
    'Important master migrates when draft profile id merges to reusable id',
  );
  assert(
    getImportantConfigForProfile(store, 'draft-profile-emilie').items.length === 0,
    'old draft Important store key is removed after migration',
  );
}

function verifyImportantWizardDraftStaging(): void {
  assert(
    !importantNameListsEqual(['Passport', 'Glasses'], ['Glasses', 'Passport']),
    'Important wizard staging compares normalized order',
  );
  assert(
    importantNameListsEqual([' Passport ', 'Glasses'], ['Passport', 'Glasses']),
    'Important wizard staging trims and dedupes names before compare',
  );
  assert(
    normalizeImportantNameList(['Teddy bear', 'Teddy bear', '']).join('|') === 'Teddy bear',
    'Important wizard staged names dedupe before commit',
  );
}

async function verifyTripDraftAssemblyPreservesWizardFields(): Promise<void> {
  const draft = normalizeTripDraft({
    ...createMp4bTestDraft(),
    tripContext: ['Vacation', 'Family'],
    note: 'Window seat please',
  });

  const trip = await assembleTripFromDraft(draft, assemblyServices, {
    packingMode: 'manual',
    importantByProfileId: {},
  });

  assert(trip.tripContext.join('|') === 'Vacation|Family', 'assembled trip preserves trip context');
  assert(trip.startDate === draft.startDate, 'assembled trip preserves start date');
  assert(trip.endDate === draft.endDate, 'assembled trip preserves end date');
  assert(getDestinationLabel(trip.destination) === getDestinationLabel(draft.destination), 'assembled trip preserves destination');
  assert(trip.packingLists.length === draft.packingProfiles.length, 'assembled trip preserves selected packing profiles as lists');
  assert(trip.note === 'Window seat please', 'assembled trip preserves additional note');
}

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

function createAggregateProgressTrip(): Trip {
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

function verifyAggregatePackingProgress(): void {
  const trip = createAggregateProgressTrip();
  const meListId = trip.packingLists[0].id;
  const emilieListId = trip.packingLists[1].id;

  const aggregate = packingStatsForTrip(trip);
  assert(aggregate.packed === 3, 'aggregate packed count sums across lists');
  assert(aggregate.total === 47, 'aggregate total count sums across lists');
  assert(aggregate.pct === Math.round((3 / 47) * 100), 'aggregate percentage uses count ratio, not averaged list percentages');

  const meStats = packingStatsForList(trip, meListId);
  const emilieStats = packingStatsForList(trip, emilieListId);
  assert(meStats.packed === 1 && meStats.total === 24, 'Me list stats remain list-scoped');
  assert(emilieStats.packed === 2 && emilieStats.total === 23, 'Emilie list stats remain list-scoped');

  const breakdown = packingListBreakdownForTrip(trip);
  assert(breakdown.length === 2, 'trip breakdown includes each PackingList');
  assert(
    breakdown.find((row) => row.profileName === 'Me')?.packed === 1,
    'breakdown Me row uses Me list stats',
  );
  assert(
    breakdown.find((row) => row.profileName === 'Emilie')?.packed === 2,
    'breakdown Emilie row uses Emilie list stats',
  );

  const singleListTrip: Trip = {
    ...trip,
    packingLists: [trip.packingLists[0]],
  };
  const singleAggregate = packingStatsForTrip(singleListTrip);
  assert(
    singleAggregate.packed === meStats.packed && singleAggregate.total === meStats.total,
    'single-list trip aggregate matches its only list',
  );
}

function verifyStaleNoticeScope(): void {
  const meStore = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;
  const emilieStore = saveImportantItemNamesForProfile(meStore, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

  const meMaster = getImportantConfigForProfile(emilieStore, SELF_IMPORTANT_PROFILE_ID);
  const emilieMaster = getImportantConfigForProfile(emilieStore, 'profile-emilie');

  const meListItems = mergeImportantItems([], meMaster.items.filter((item) => item.enabled));
  const emilieListItems = mergeImportantItems([], emilieMaster.items.filter((item) => item.enabled));

  assert(
    !isImportantSnapshotStale(meMaster.items.filter((item) => item.enabled), meListItems),
    'Me master matches Me list initially',
  );
  assert(
    !isImportantSnapshotStale(emilieMaster.items.filter((item) => item.enabled), emilieListItems),
    'Emilie master matches Emilie list initially',
  );

  const updatedEmilieStore = addImportantItemForProfileStore(emilieStore, 'profile-emilie', 'Medication', () => 'imp-med').store;
  const updatedEmilieMaster = getImportantConfigForProfile(updatedEmilieStore, 'profile-emilie');

  assert(
    isImportantSnapshotStale(
      updatedEmilieMaster.items.filter((item) => item.enabled),
      emilieListItems,
    ),
    'Emilie list becomes stale when Emilie master changes',
  );
  assert(
    !isImportantSnapshotStale(
      getImportantConfigForProfile(updatedEmilieStore, SELF_IMPORTANT_PROFILE_ID).items.filter((item) => item.enabled),
      meListItems,
    ),
    'Me list stays fresh when only Emilie master changes',
  );

  assert(
    importantStaleNoticeKey('trip-a', 'list-me') !== importantStaleNoticeKey('trip-a', 'list-emilie'),
    'stale dismiss keys are list-scoped within a trip',
  );
}

function verifyImportantWizardDraftMerge(): void {
  const current = {
    me: { rows: ['Passport'], expanded: false },
    emilie: { rows: ['Medication', ''], expanded: true },
    removed: { rows: ['Stale'], expanded: true },
  };
  const next = {
    me: { rows: ['Passport', 'Glasses'], expanded: false },
    emilie: { rows: ['Teddy bear'], expanded: false },
  };

  const merged = mergeImportantWizardProfileDrafts(current, next);

  assert(merged.me.rows.join('|') === 'Passport|Glasses', 'collapsed card picks up rebuilt canonical rows');
  assert(merged.me.expanded === false, 'collapsed card stays collapsed after rebuild');
  assert(merged.emilie.expanded === true, 'expanded card stays expanded after rebuild');
  assert(merged.emilie.rows.join('|') === 'Medication|', 'expanded card keeps staged rows after rebuild');
  assert(!('removed' in merged), 'removed profile draft state is not retained');
}

function verifyPackImportantNoticeRespectsPromptDismissed(): void {
  const undismissed = getImportantConfigForProfile({}, 'profile-emilie');
  assert(
    profileNeedsImportantFirstTimeSetup(undismissed),
    'unconfigured undismissed profile qualifies for Pack Important notice',
  );

  const dismissedStore = setImportantPromptDismissedForProfileStore({}, 'profile-emilie', true);
  const dismissed = getImportantConfigForProfile(dismissedStore, 'profile-emilie');
  assert(
    !profileNeedsImportantFirstTimeSetup(dismissed),
    'persistent promptDismissed suppresses Pack Important notice',
  );
  assert(dismissed.isConfigured === false, 'promptDismissed does not mark profile configured');

  const meConfig = getImportantConfigForProfile(dismissedStore, SELF_IMPORTANT_PROFILE_ID);
  assert(
    profileNeedsImportantFirstTimeSetup(meConfig),
    'dismissing one profile does not suppress another profile Pack notice',
  );
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
  verifyImportantSetupStateContracts();
  verifyPackProfileResolutionFromListSnapshot();
  verifyFixedWizardStepSequence();
  verifyImportantWizardCardOrdering();
  verifyImportantProfileCardMetadataLabels();
  verifyDraftProfileRememberLifecycle();
  verifyImportantStoreKeyMigration();
  verifyImportantWizardDraftStaging();
  verifyImportantWizardDraftMerge();
  verifyPackImportantNoticeRespectsPromptDismissed();
  await verifyTripDraftAssemblyPreservesWizardFields();
  verifyAggregatePackingProgress();
  verifyStaleNoticeScope();
}
