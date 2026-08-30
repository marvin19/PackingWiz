import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { SettingsCard, SettingsDivider } from '@/components/ui/settings/settings-card';
import { SettingsLinkRow } from '@/components/ui/settings/settings-link-row';
import { importantProfileStatusLabel } from '@/domain/important-profile-setup';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import type { PackingProfile } from '@/domain/packing-profile';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

type ImportantProfileMenuRowsProps = {
  profiles: PackingProfile[];
  onOpenProfile: (profile: PackingProfile) => void;
};

export function ImportantProfileMenuRows({ profiles, onOpenProfile }: ImportantProfileMenuRowsProps) {
  const theme = useTheme();
  const { getImportantConfigForProfile, resolveImportantProfileId } = useProfile();

  return (
    <SettingsCard>
      {profiles.map((profile, index) => {
        const label = formatPackingListProfileName(profile);
        const config = getImportantConfigForProfile(resolveImportantProfileId(profile));
        const hint = importantProfileStatusLabel(config);

        return (
          <View key={profile.id}>
            {index > 0 ? <SettingsDivider /> : null}
            <SettingsLinkRow
              icon={<Feather name="star" size={18} color={theme.colors.primary} />}
              label={`Important for ${label}`}
              hint={hint}
              onPress={() => onOpenProfile(profile)}
            />
          </View>
        );
      })}
    </SettingsCard>
  );
}
