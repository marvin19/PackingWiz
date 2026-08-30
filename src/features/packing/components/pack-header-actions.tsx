import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type PackInsightsButtonProps = {
  onPress: () => void;
  iconOnly?: boolean;
};

export function PackInsightsButton({ onPress, iconOnly = false }: PackInsightsButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Insights"
      onPress={onPress}
      style={({ pressed }) => [
        styles.textAction,
        iconOnly && styles.iconOnlyAction,
        {
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Ionicons name="bulb-outline" size={16} color={theme.colors.mutedForeground} />
      {iconOnly ? null : (
        <AppText
          variant="caption"
          style={{
            fontFamily: theme.fontFamilies.sansSemiBold,
            color: theme.colors.mutedForeground,
          }}>
          Insights
        </AppText>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
    justifyContent: 'center',
  },
  iconOnlyAction: {
    paddingHorizontal: 8,
    minWidth: 32,
  },
  backToTripsAction: {
    paddingHorizontal: 8,
  },
});
