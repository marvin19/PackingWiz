import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
export const TRIP_PACK_READ_ONLY_MESSAGE =
  'This trip has ended. Packing lists are read-only.';

type TripReadOnlyBannerProps = {
  /** When false, renders nothing (keeps call sites simple). */
  visible: boolean;
};

export function TripReadOnlyBanner({ visible }: TripReadOnlyBannerProps) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={TRIP_PACK_READ_ONLY_MESSAGE}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
        },
      ]}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.copy}>
        {TRIP_PACK_READ_ONLY_MESSAGE}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copy: {
    lineHeight: 20,
    flexShrink: 1,
  },
});