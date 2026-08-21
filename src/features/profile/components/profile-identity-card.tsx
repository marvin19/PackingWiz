import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { UserProfile } from '@/domain/user-profile';

type ProfileIdentityCardProps = {
  profile: UserProfile;
};

export function ProfileIdentityCard({ profile }: ProfileIdentityCardProps) {
  const theme = useTheme();

  return (
    <View
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
          {profile.initials}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySemiBold" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
          {profile.displayName}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground">
          {profile.email}
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
