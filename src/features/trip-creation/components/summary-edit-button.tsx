import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';

type SummaryEditButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  compact?: boolean;
};

export function SummaryEditButton({ accessibilityLabel, onPress, compact = false }: SummaryEditButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={compact ? 10 : 8}
      style={({ pressed }) => [styles.button, compact && styles.buttonCompact, pressed && styles.pressed]}>
      <Feather name="edit-2" size={14} color={theme.colors.primary} />
      <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
        Edit
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    flexShrink: 0,
  },
  buttonCompact: {
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
