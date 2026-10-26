import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type WizardFooterProps = {
  label: string;
  disabled: boolean;
  onPress: () => void;
  /** Shown above the primary action when Continue is disabled (wizard eligibility guidance). */
  continueHint?: string | null;
};

export function WizardFooter({ label, disabled, onPress, continueHint }: WizardFooterProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const showHint = disabled && continueHint;

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingHorizontal: screenPaddingHorizontal,
          paddingBottom: Math.max(insets.bottom, theme.spacing.base),
        },
      ]}>
      {showHint ? (
        <AppText
          variant="bodySmall"
          color="mutedForeground"
          style={styles.continueHint}
          accessibilityRole="text"
          accessibilityLiveRegion="polite">
          {continueHint}
        </AppText>
      ) : null}
      <PrimaryButton label={label} disabled={disabled} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 8,
  },
  continueHint: {
    lineHeight: 20,
    paddingHorizontal: 4,
  },
});
