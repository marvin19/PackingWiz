import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type WizardFooterProps = {
  label: string;
  disabled: boolean;
  onPress: () => void;
};

export function WizardFooter({ label, disabled, onPress }: WizardFooterProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
      <PrimaryButton label={label} disabled={disabled} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
});
