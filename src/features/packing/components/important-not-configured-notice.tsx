import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type ImportantNotConfiguredNoticeProps = {
  profileLabel: string;
  onOpenProfile: () => void;
  onDismiss: () => void;
};

export function ImportantNotConfiguredNotice({
  profileLabel,
  onOpenProfile,
  onDismiss,
}: ImportantNotConfiguredNoticeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="caption" color="secondaryForeground" style={styles.copy}>
        Important items aren&apos;t configured for {profileLabel}. You can set them up anytime in{' '}
        <AppText
          variant="caption"
          color="primary"
          onPress={onOpenProfile}
          accessibilityRole="link"
          accessibilityLabel={`Open Profile to configure Important items for ${profileLabel}`}
          style={{ fontFamily: theme.fontFamilies.sansSemiBold, textDecorationLine: 'underline' }}>
          Profile
        </AppText>
        .
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notice"
        onPress={onDismiss}
        hitSlop={8}
        style={styles.dismiss}>
        <Feather name="x" size={14} color={theme.colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  copy: {
    flex: 1,
    lineHeight: 18,
  },
  dismiss: {
    paddingTop: 1,
  },
});
