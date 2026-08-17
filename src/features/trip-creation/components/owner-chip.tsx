import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type OwnerChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function OwnerChip({ label, active, onPress }: OwnerChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.background,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="caption"
        style={{
          color: active ? theme.colors.primaryForeground : theme.colors.foreground,
          fontFamily: theme.fontFamilies.sansMedium,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.95,
  },
});
