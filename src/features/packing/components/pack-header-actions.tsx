import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

export function PackInsightsButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Insights"
      onPress={onPress}
      style={({ pressed }) => [
        styles.textAction,
        {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.fontFamilies.sansSemiBold,
          color: theme.colors.mutedForeground,
        }}>
        Insights
      </AppText>
    </Pressable>
  );
}

export function PackBackToTripsButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const iconColor = theme.colors.mutedForeground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to all trips"
      onPress={onPress}
      style={({ pressed }) => [
        styles.textAction,
        styles.backToTripsAction,
        {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Feather name="arrow-left" size={14} color={iconColor} />
      <Feather name="briefcase" size={14} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  textAction: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
    justifyContent: 'center',
  },
  backToTripsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
});
