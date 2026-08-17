import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { TripFeatherIcon } from '@/features/trips/utils/trip-type-icon';

type OptionCardProps = {
  label: string;
  icon: TripFeatherIcon;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

export function OptionCard({ label, icon, selected, onPress, compact = false }: OptionCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.card,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: selected ? theme.colors.primary : theme.colors.muted,
          },
        ]}>
        <Feather
          name={icon}
          size={20}
          color={selected ? theme.colors.primaryForeground : theme.colors.mutedForeground}
        />
      </View>
      <AppText variant="bodySmall" numberOfLines={2} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31%',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardCompact: {
    width: '48%',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.95,
  },
});
