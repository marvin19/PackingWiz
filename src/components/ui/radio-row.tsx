import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

type RadioRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RadioRow({ label, selected, onPress }: RadioRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.card,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <AppText variant="bodySmall" style={{ fontFamily: 'Inter_500Medium' }}>
        {label}
      </AppText>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: selected ? theme.colors.primary : 'transparent',
          },
        ]}>
        {selected ? <Feather name="check" size={12} color={theme.colors.primaryForeground} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.95,
  },
});
