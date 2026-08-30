import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { sortProfilesForImportantWizardStep } from '@/domain/important-profile-setup';
import type { PackingProfile } from '@/domain/packing-profile';
import { ImportantProfileCard } from '@/features/trip-creation/components/important-profile-card';
import {
  draftRowsFromImportantNames,
  importantNameListsEqual,
  normalizeImportantNameList,
} from '@/features/trip-creation/utils/important-wizard-draft';
import { useProfile } from '@/hooks/use-profile';

export type ImportantSetupStepHandle = {
  commitStagedChanges: () => void;
};

type ImportantSetupStepProps = {
  profiles: PackingProfile[];
};

type ProfileDraftState = {
  rows: string[];
  expanded: boolean;
};

function buildInitialProfileDrafts(
  profiles: PackingProfile[],
  getSavedNames: (profile: PackingProfile) => string[],
): Record<string, ProfileDraftState> {
  return Object.fromEntries(
    profiles.map((profile) => {
      const savedNames = getSavedNames(profile);

      return [
        profile.id,
        {
          rows: draftRowsFromImportantNames(savedNames),
          expanded: false,
        },
      ];
    }),
  );
}

export const ImportantSetupStep = forwardRef<ImportantSetupStepHandle, ImportantSetupStepProps>(
  function ImportantSetupStep({ profiles }, ref) {
    const {
      dismissImportantPromptForProfile,
      getImportantConfigForProfile,
      getImportantItemsForProfile,
      importantByProfileId,
      resolveImportantProfileId,
      saveImportantItemsForProfile,
    } = useProfile();

    const profileIdsKey = profiles.map((profile) => profile.id).join('|');

    const orderedProfiles = useMemo(
      () => sortProfilesForImportantWizardStep(profiles, importantByProfileId),
      [importantByProfileId, profiles],
    );

    const getSavedNames = useCallback(
      (profile: PackingProfile) => {
        const canonicalProfileId = resolveImportantProfileId(profile);
        return getImportantItemsForProfile(canonicalProfileId).map((item) => item.name);
      },
      [getImportantItemsForProfile, resolveImportantProfileId],
    );

    const [draftsByProfileId, setDraftsByProfileId] = useState<Record<string, ProfileDraftState>>(() =>
      buildInitialProfileDrafts(profiles, getSavedNames),
    );

    useEffect(() => {
      setDraftsByProfileId((current) => {
        const next = buildInitialProfileDrafts(profiles, getSavedNames);

        for (const profileId of Object.keys(current)) {
          if (next[profileId]?.expanded) {
            next[profileId] = {
              ...next[profileId],
              expanded: true,
              rows: current[profileId].rows,
            };
          }
        }

        return next;
      });
    }, [getSavedNames, profileIdsKey, profiles]);

    const updateProfileDraft = useCallback((profileId: string, patch: Partial<ProfileDraftState>) => {
      setDraftsByProfileId((current) => ({
        ...current,
        [profileId]: {
          ...current[profileId],
          ...patch,
        },
      }));
    }, []);

    const commitStagedChanges = useCallback(() => {
      for (const profile of profiles) {
        const canonicalProfileId = resolveImportantProfileId(profile);
        const draft = draftsByProfileId[profile.id];
        if (!draft) {
          continue;
        }

        const stagedNames = normalizeImportantNameList(draft.rows);
        const savedNames = getSavedNames(profile);

        if (!importantNameListsEqual(stagedNames, savedNames)) {
          saveImportantItemsForProfile(canonicalProfileId, stagedNames);
        }
      }
    }, [
      draftsByProfileId,
      getSavedNames,
      profiles,
      resolveImportantProfileId,
      saveImportantItemsForProfile,
    ]);

    useImperativeHandle(ref, () => ({ commitStagedChanges }), [commitStagedChanges]);

    return (
      <View style={styles.wrap}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.intro}>
          Review the things you never want PackingWiz to forget.
        </AppText>

        <View style={styles.cards}>
          {orderedProfiles.map((profile) => {
            const canonicalProfileId = resolveImportantProfileId(profile);
            const config = getImportantConfigForProfile(canonicalProfileId);
            const draft = draftsByProfileId[profile.id] ?? {
              rows: [''],
              expanded: false,
            };

            return (
              <ImportantProfileCard
                key={profile.id}
                profile={profile}
                config={config}
                stagedRows={draft.rows}
                expanded={draft.expanded}
                onChangeRows={(rows) => updateProfileDraft(profile.id, { rows })}
                onExpand={() =>
                  updateProfileDraft(profile.id, {
                    expanded: true,
                    rows: draftRowsFromImportantNames(getSavedNames(profile)),
                  })
                }
                onCollapse={() => updateProfileDraft(profile.id, { expanded: false })}
                onConfigureLater={() => {
                  dismissImportantPromptForProfile(canonicalProfileId);
                  updateProfileDraft(profile.id, { expanded: false });
                }}
              />
            );
          })}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  intro: {
    lineHeight: 20,
  },
  cards: {
    gap: 12,
  },
});
