import type { ImportantItemsConfig } from '@/domain/important-items-config';
import {
  cloneImportantItemsConfig,
  defaultImportantItemsConfig,
} from '@/domain/important-items-config';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  pickImportantConfigForProfilePersist,
  resolveImportantConfigForPersistedProfile,
  resolveRememberedPackingProfileForPersistence,
  shouldPersistRememberedTripProfile,
} from '@/domain/remembered-packing-profile';
import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';
import { persistRememberedProfileWithImportant } from '@/repositories/profiles/supabase-packing-profile-repository';

export type PersistCommittedTripProfilesInput = {
  tripProfiles: PackingProfile[];
  savedProfiles: PackingProfile[];
  draftImportantByProfileId: ImportantItemsByProfileId;
  globalImportantByProfileId: ImportantItemsByProfileId;
  profileRepository: PackingProfileRepository;
  rememberPackingProfile: (profile: PackingProfile, draftImportantConfig?: ImportantItemsConfig) => void;
};

export type PersistCommittedTripProfilesResult = {
  resolvedProfiles: PackingProfile[];
  errors: string[];
};

/** Remember + Supabase upsert for trip-committed reusable profiles. */
export async function persistCommittedTripProfiles(
  input: PersistCommittedTripProfilesInput,
): Promise<PersistCommittedTripProfilesResult> {
  const resolvedProfiles: PackingProfile[] = [];
  const errors: string[] = [];

  for (const profile of input.tripProfiles) {
    if (!shouldPersistRememberedTripProfile(profile)) {
      continue;
    }

    const resolved = resolveRememberedPackingProfileForPersistence(profile, input.savedProfiles);
    resolvedProfiles.push(resolved);

    const important =
      pickImportantConfigForProfilePersist(
        input.draftImportantByProfileId,
        profile.id,
        resolved.id,
      ) ??
      pickImportantConfigForProfilePersist(
        input.globalImportantByProfileId,
        profile.id,
        resolved.id,
      ) ??
      cloneImportantItemsConfig(defaultImportantItemsConfig);

    input.rememberPackingProfile(resolved, important);

    try {
      await persistRememberedProfileWithImportant(input.profileRepository, resolved, important);
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `Could not save ${resolved.name} for future trips`,
      );
    }
  }

  return { resolvedProfiles, errors };
}

export function mergeImportantAfterProfilePersist(
  store: ImportantItemsByProfileId,
  sourceProfileId: string,
  resolvedProfileId: string,
): ImportantItemsByProfileId {
  return resolveImportantConfigForPersistedProfile(store, sourceProfileId, resolvedProfileId);
}
