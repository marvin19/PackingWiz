import { Feather } from '@expo/vector-icons';
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
          backgroundColor: `${theme.colors.important}14`,
          borderColor: `${theme.colors.important}55`,
        },
      ]}>
      <View style={styles.contentRow}>
        <Feather
          name="alert-triangle"
          size={16}
          color={theme.colors.important}
          style={styles.icon}
        />
        <AppText
          variant="bodySmall"
          style={[
            styles.copy,
            {
              color: theme.colors.importantForeground,
              fontFamily: theme.fontFamilies.sansMedium,
            },
          ]}>
          {TRIP_PACK_READ_ONLY_MESSAGE}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  copy: {
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
});