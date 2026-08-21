import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal, spacing } from '@/theme/spacing';

type SummaryFooterProps = {
  onGenerate: () => void;
  onManualCreate: () => void;
  manualCreateDisabled?: boolean;
  manualCreateLoading?: boolean;
};

export function SummaryFooter({
  onGenerate,
  onManualCreate,
  manualCreateDisabled = false,
  manualCreateLoading = false,
}: SummaryFooterProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingHorizontal: screenPaddingHorizontal,
          paddingBottom: Math.max(insets.bottom, theme.spacing.base),
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Generate my packing list"
        onPress={onGenerate}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.92 : 1 },
        ]}>
        <Feather name="star" size={20} color={theme.colors.primaryForeground} />
        <AppText
          variant="body"
          style={{ color: theme.colors.primaryForeground, fontFamily: theme.fontFamilies.displayExtraBold }}>
          Generate my packing list
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create packing list manually"
        accessibilityState={{ disabled: manualCreateDisabled || manualCreateLoading }}
        disabled={manualCreateDisabled || manualCreateLoading}
        onPress={onManualCreate}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            borderColor: theme.colors.border,
            opacity: manualCreateDisabled || manualCreateLoading ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}>
        {manualCreateLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Create packing list manually
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 9999,
    paddingVertical: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
});
