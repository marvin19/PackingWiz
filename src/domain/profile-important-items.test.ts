import {
  getImportantConfigForProfile,
  migrateImportantProfileStoreKey,
  normalizeImportantProfileId,
  resolveImportantProfileId,
  saveImportantItemNamesForProfile,
  setImportantConfigForProfile,
  SELF_IMPORTANT_PROFILE_ID,
  setImportantEnabledForProfileStore,
} from '@/domain/profile-important-items';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';

describe('profile-scoped Important master', () => {
  it('keeps Me and Emilie items isolated', () => {
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
    store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

    const meItems = getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID).items.map((item) => item.name);
    const emilieItems = getImportantConfigForProfile(store, 'profile-emilie').items.map((item) => item.name);

    expect(meItems).toEqual(['Passport', 'Glasses']);
    expect(emilieItems).toEqual(['Teddy bear']);
  });

  it('does not mutate Me when Emilie Important is disabled', () => {
    let store = saveImportantItemNamesForProfile({}, SELF_IMPORTANT_PROFILE_ID, ['Passport'], () => 'imp-passport').store;
    store = saveImportantItemNamesForProfile(store, 'profile-emilie', ['Teddy bear'], () => 'imp-teddy').store;

    store = setImportantEnabledForProfileStore(store, 'profile-emilie', false);

    const meConfig = getImportantConfigForProfile(store, SELF_IMPORTANT_PROFILE_ID);
    const emilieConfig = getImportantConfigForProfile(store, 'profile-emilie');

    expect(meConfig.isEnabled).toBe(true);
    expect(meConfig.items[0].name).toBe('Passport');
    expect(emilieConfig.isEnabled).toBe(false);
    expect(emilieConfig.items[0].name).toBe('Teddy bear');
  });
});

describe('resolveImportantProfileId', () => {
  it('maps self profiles to the canonical self Important id', () => {
    expect(resolveImportantProfileId({ id: DRAFT_SELF_PROFILE_ID, isSelf: true })).toBe(
      SELF_IMPORTANT_PROFILE_ID,
    );
    expect(normalizeImportantProfileId(DRAFT_SELF_PROFILE_ID)).toBe(SELF_IMPORTANT_PROFILE_ID);
  });

  it('keeps non-self profile ids stable', () => {
    expect(resolveImportantProfileId({ id: 'profile-emilie', isSelf: false })).toBe('profile-emilie');
  });
});

describe('remember + Important promotion ordering', () => {
  it('preserves draft Important when draft profile id migrates to saved profile id', () => {
    const draftProfileId = 'draft-profile-jonas';
    const savedProfileId = 'profile-jonas';
    const draftConfig = saveImportantItemNamesForProfile({}, draftProfileId, ['Passport'], () => 'imp-passport')
      .store[draftProfileId];

    let store = setImportantConfigForProfile({}, draftProfileId, draftConfig);
    store = migrateImportantProfileStoreKey(store, draftProfileId, savedProfileId);

    expect(getImportantConfigForProfile(store, savedProfileId).items.map((item) => item.name)).toEqual([
      'Passport',
    ]);
    expect(store[draftProfileId]).toBeUndefined();
  });
});
