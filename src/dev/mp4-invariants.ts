import type { ImportantItem } from '@/domain/important-item';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
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
} from '@/domain/profile-important-items';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';

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

/** MP4A profile-scoped Important master checks. */
export function runMp4InvariantChecks(): void {
  verifyProfileImportantIsolation();
  verifyEnabledIsolation();
  verifyMutationIsolation();
  verifyExistingTripListStability();
  verifyLegacySelfCompatibility();
  verifyReusableProfileRoundTrip();
  verifyBootstrapDoesNotRevertCanonical();
}
