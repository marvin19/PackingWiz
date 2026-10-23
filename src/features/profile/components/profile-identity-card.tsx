import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  formatSelfPackingProfileIdentityHint,
  selfPackingProfileInitials,
} from '@/domain/self-packing-profile';
import { useTheme } from '@/hooks/use-theme';

type ProfileIdentityCardProps = {
  profile: PackingProfile;
};

export function ProfileIdentityCard({ profile }: ProfileIdentityCardProps) {
  const theme = useTheme();
  const displayName = formatPackingListProfileName(profile);
  const hint = formatSelfPackingProfileIdentityHint(profile);

  return (
    <View
      accessibilityLabel={`${displayName}, ${hint}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        <AppText
          variant="subheading"
          color="primaryForeground"
          style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
          {selfPackingProfileInitials(profile)}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySemiBold" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
          {displayName}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground">
          {hint}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
