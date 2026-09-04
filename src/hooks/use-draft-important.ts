import { useCallback, useMemo } from 'react';

import { mergeImportantStores, readImportantConfigFromStores, isDraftOnlyProfileId } from '@/domain/draft-important-scope';
import type { ImportantItem } from '@/domain/important-item';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import { resolveImportantProfileId } from '@/domain/profile-important-items';
import type { PackingProfile } from '@/domain/packing-profile';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';

/**
 * Routes Important reads/writes to the global profile store or the active draft envelope.
 */
export function useDraftImportant() {
  const profile = useProfile();
  const {
    getActiveDraftImportantByProfileId,
    saveDraftImportantItemsForProfile,
    dismissDraftImportantPromptForProfile,
  } = useTrips();

  const savedProfileIds = useMemo(
    () => new Set(profile.savedPackingProfiles.map((entry) => entry.id)),
    [profile.savedPackingProfiles],
  );

  const draftImportantByProfileId = getActiveDraftImportantByProfileId();

  const mergedImportantByProfileId = useMemo(
    () => mergeImportantStores(profile.importantByProfileId, draftImportantByProfileId),
    [draftImportantByProfileId, profile.importantByProfileId],
  );

  const isDraftScopedProfile = useCallback(
    (profileId: string) => isDraftOnlyProfileId(profileId, savedProfileIds),
    [savedProfileIds],
  );

  const getImportantConfigForProfile = useCallback(
    (profileId: string): ImportantItemsConfig =>
      readImportantConfigFromStores(
        profile.importantByProfileId,
        draftImportantByProfileId,
        profileId,
        savedProfileIds,
      ),
    [draftImportantByProfileId, profile.importantByProfileId, savedProfileIds],
  );

  const getImportantItemsForProfile = useCallback(
    (profileId: string) => getImportantConfigForProfile(profileId).items,
    [getImportantConfigForProfile],
  );

  const saveImportantItemsForProfile = useCallback(
    (profileId: string, names: string[]): ImportantItem[] => {
      const normalizedId = resolveImportantProfileId({ id: profileId, isSelf: false });

      if (isDraftScopedProfile(profileId)) {
        return saveDraftImportantItemsForProfile(profileId, names);
      }

      return profile.saveImportantItemsForProfile(normalizedId, names);
    },
    [isDraftScopedProfile, profile, saveDraftImportantItemsForProfile],
  );

  const dismissImportantPromptForProfile = useCallback(
    (profileId: string) => {
      if (isDraftScopedProfile(profileId)) {
        dismissDraftImportantPromptForProfile(profileId);
        return;
      }

      profile.dismissImportantPromptForProfile(profileId);
    },
    [dismissDraftImportantPromptForProfile, isDraftScopedProfile, profile],
  );

  return {
    importantByProfileId: mergedImportantByProfileId as ImportantItemsByProfileId,
    resolveImportantProfileId: profile.resolveImportantProfileId,
    getImportantConfigForProfile,
    getImportantItemsForProfile,
    saveImportantItemsForProfile,
    dismissImportantPromptForProfile,
    getSavedNames: (packingProfile: PackingProfile) => {
      const canonicalProfileId = profile.resolveImportantProfileId(packingProfile);
      return getImportantItemsForProfile(canonicalProfileId).map((item) => item.name);
    },
  };
}
