import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SettingsCard, SettingsDivider } from '@/components/ui/settings/settings-card';
import { SettingsLinkRow } from '@/components/ui/settings/settings-link-row';
import { formatPackingListProfileSubtitle } from '@/domain/packing-list-display';
import type { PackingProfile } from '@/domain/packing-profile';
import { listReusableSavedPackingProfiles } from '@/domain/saved-packing-profiles';
import { useTheme } from '@/hooks/use-theme';

type SavedPackingProfileMenuRowsProps = {
  profiles: PackingProfile[];
};

export function SavedPackingProfileMenuRows({ profiles }: SavedPackingProfileMenuRowsProps) {
  const theme = useTheme();
  const reusableProfiles = useMemo(() => listReusableSavedPackingProfiles(profiles), [profiles]);

  if (reusableProfiles.length === 0) {
    return (
      <SettingsCard>
        <View style={styles.emptyRow}>
          <AppText variant="bodySmall" color="mutedForeground">
            No one saved yet. When you add someone on a trip, you can remember them for future trips.
          </AppText>
        </View>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      {reusableProfiles.map((profile, index) => {
        const subtitle = formatPackingListProfileSubtitle(profile);

        return (
          <View key={profile.id}>
            {index > 0 ? <SettingsDivider /> : null}
            <SettingsLinkRow
              icon={<Feather name="user" size={16} color={theme.colors.accentForeground} />}
              label={profile.name}
              hint={subtitle ?? undefined}
            />
          </View>
        );
      })}
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
