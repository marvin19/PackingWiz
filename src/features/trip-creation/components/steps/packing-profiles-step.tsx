import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingProfile } from '@/domain/packing-profile';
import { availableSavedPackingProfiles } from '@/domain/trip-draft-profiles';
import type { TripDraft } from '@/domain/trip-draft';
import { AddPackingProfileSheet } from '@/features/trip-creation/components/add-packing-profile-sheet';
import { PackingProfileRow } from '@/features/trip-creation/components/packing-profile-row';
import { SavedPackingProfileRow } from '@/features/trip-creation/components/saved-packing-profile-row';
import { useTheme } from '@/hooks/use-theme';

type PackingProfilesStepProps = {
  draft: TripDraft;
  savedPackingProfiles: PackingProfile[];
  onAddProfile: (name: string, age: number, rememberForFutureTrips: boolean) => void;
  onAddSavedProfile: (profile: PackingProfile) => void;
  onRemoveProfile: (profileId: string) => void;
};

export function PackingProfilesStep({
  draft,
  savedPackingProfiles,
  onAddProfile,
  onAddSavedProfile,
  onRemoveProfile,
}: PackingProfilesStepProps) {
  const theme = useTheme();
  const [addProfileVisible, setAddProfileVisible] = useState(false);

  const availableSavedProfiles = useMemo(
    () => availableSavedPackingProfiles(savedPackingProfiles, draft.packingProfiles),
    [draft.packingProfiles, savedPackingProfiles],
  );

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.lead}>
        PackingWiz will create a packing list for each person selected here.
      </AppText>

      <View style={styles.section}>
        <AppText variant="sectionLabel" color="mutedForeground" style={styles.sectionLabel}>
          Selected
        </AppText>
        <View style={styles.list}>
          {draft.packingProfiles.map((profile) => (
            <PackingProfileRow
              key={profile.id}
              profile={profile}
              canRemove={!profile.isSelf}
              onRemove={() => onRemoveProfile(profile.id)}
            />
          ))}
        </View>
      </View>

      {availableSavedProfiles.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel" color="mutedForeground" style={styles.sectionLabel}>
            People you&apos;ve packed for before
          </AppText>
          <View style={styles.list}>
            {availableSavedProfiles.map((profile) => (
              <SavedPackingProfileRow
                key={profile.id}
                profile={profile}
                onSelect={() => onAddSavedProfile(profile)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add someone new"
        onPress={() => setAddProfileVisible(true)}
        style={({ pressed }) => [
          styles.addTrigger,
          { borderColor: theme.colors.border },
          pressed && styles.pressed,
        ]}>
        <Feather name="plus" size={16} color={theme.colors.primary} />
        <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          Add someone new
        </AppText>
      </Pressable>

      <AddPackingProfileSheet
        visible={addProfileVisible}
        existingProfiles={draft.packingProfiles}
        onAdd={onAddProfile}
        onClose={() => setAddProfileVisible(false)}
      />

      <View style={[styles.infoBanner, { backgroundColor: theme.colors.muted }]}>
        <Feather name="users" size={16} color={theme.colors.primary} style={styles.infoIcon} />
        <AppText variant="caption" color="mutedForeground" style={styles.infoText}>
          Age helps tailor clothing and essentials. Me is always included for your own list.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  lead: {
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    letterSpacing: 0.4,
  },
  list: {
    gap: 8,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.95,
  },
});
