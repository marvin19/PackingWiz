import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import {
  getImportantConfigForProfile,
  normalizeImportantProfileId,
  SELF_IMPORTANT_PROFILE_ID,
} from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';

/** Profile ids that belong to a draft envelope, not the global reusable store. */
export function isDraftOnlyProfileId(
  profileId: string,
  savedReusableProfileIds: ReadonlySet<string>,
): boolean {
  const normalizedId = normalizeImportantProfileId(profileId);

  if (normalizedId === SELF_IMPORTANT_PROFILE_ID || profileId === DRAFT_SELF_PROFILE_ID) {
    return false;
  }

  if (savedReusableProfileIds.has(profileId) || savedReusableProfileIds.has(normalizedId)) {
    return false;
  }

  return profileId.startsWith('draft-profile-');
}

export function collectDraftOnlyProfileIds(
  packingProfiles: PackingProfile[],
  savedReusableProfileIds: ReadonlySet<string>,
): string[] {
  return packingProfiles
    .filter((profile) => !profile.isSelf)
    .map((profile) => profile.id)
    .filter((profileId) => isDraftOnlyProfileId(profileId, savedReusableProfileIds));
}

/** Merge global Important masters with draft-scoped overrides (draft keys win). */
export function mergeImportantStores(
  globalStore: ImportantItemsByProfileId,
  draftStore: ImportantItemsByProfileId,
): ImportantItemsByProfileId {
  const merged: ImportantItemsByProfileId = {};

  for (const [profileId, config] of Object.entries(globalStore)) {
    merged[profileId] = cloneImportantItemsConfig(config);
  }

  for (const [profileId, config] of Object.entries(draftStore)) {
    merged[profileId] = cloneImportantItemsConfig(config);
  }

  return merged;
}

export function readImportantConfigFromStores(
  globalStore: ImportantItemsByProfileId,
  draftStore: ImportantItemsByProfileId,
  profileId: string,
  savedReusableProfileIds: ReadonlySet<string>,
): ImportantItemsConfig {
  const normalizedId = normalizeImportantProfileId(profileId);

  if (isDraftOnlyProfileId(profileId, savedReusableProfileIds)) {
    const draftConfig = draftStore[normalizedId] ?? draftStore[profileId];
    if (draftConfig) {
      return cloneImportantItemsConfig(draftConfig);
    }

    return cloneImportantItemsConfig(defaultImportantItemsConfig);
  }

  return getImportantConfigForProfile(globalStore, normalizedId);
}

export function removeProfileIdsFromImportantStore(
  store: ImportantItemsByProfileId,
  profileIds: string[],
): ImportantItemsByProfileId {
  if (profileIds.length === 0) {
    return store;
  }

  const idsToRemove = new Set(
    profileIds.flatMap((profileId) => [profileId, normalizeImportantProfileId(profileId)]),
  );

  let changed = false;
  const next: ImportantItemsByProfileId = { ...store };

  for (const profileId of idsToRemove) {
    if (Object.prototype.hasOwnProperty.call(next, profileId)) {
      delete next[profileId];
      changed = true;
    }
  }

  return changed ? next : store;
}
