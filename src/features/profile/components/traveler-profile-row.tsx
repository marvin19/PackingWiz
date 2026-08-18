import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { SavedTravelerProfile } from '@/domain/user-settings';
import { useTheme } from '@/hooks/use-theme';

type TravelerProfileRowProps = {
  traveler: SavedTravelerProfile;
};

function formatTravelerHint(traveler: SavedTravelerProfile): string {
  if (traveler.role === 'Child' && traveler.age != null) {
    return `Child · ${traveler.age}`;
  }

  return traveler.role;
}

export function TravelerProfileRow({ traveler }: TravelerProfileRowProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={`${traveler.name}, ${formatTravelerHint(traveler)}`}
      style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name="users" size={16} color={theme.colors.accentForeground} />
      </View>
      <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
        {traveler.name}
      </AppText>
      <AppText variant="caption" color="mutedForeground">
        {formatTravelerHint(traveler)}
      </AppText>
    </View>
  );
}

type AddTravelerRowProps = {
  onPress: () => void;
};

export function AddTravelerRow({ onPress }: AddTravelerRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a traveler"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name="plus" size={16} color={theme.colors.primary} />
      </View>
      <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
        Add a traveler
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
