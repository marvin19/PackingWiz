import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type SummaryFooterProps = {
  onPress: () => void;
};

export function SummaryFooter({ onPress }: SummaryFooterProps) {
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
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.92 : 1 },
        ]}>
        <Feather name="star" size={20} color={theme.colors.primaryForeground} />
        <AppText
          variant="body"
          style={{ color: theme.colors.primaryForeground, fontFamily: theme.fontFamilies.displayExtraBold }}>
          Generate my packing list
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9999,
    paddingVertical: 14,
  },
});
