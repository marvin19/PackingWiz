import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingList } from '@/domain/packing-list';
import {
  formatPackingListPickerLabel,
  formatPackingListProfileName,
  formatPackingListProfileSubtitle,
  formatPackingListProgress,
} from '@/domain/packing-list-display';
import type { Trip } from '@/domain/trip';
import { useTheme } from '@/hooks/use-theme';

type PackingListOptionRowProps = {
  trip: Trip;
  list: PackingList;
  selected?: boolean;
  onPress: () => void;
};

export function PackingListOptionRow({ trip, list, selected = false, onPress }: PackingListOptionRowProps) {
  const theme = useTheme();
  const name = formatPackingListProfileName(list.profileSnapshot);
  const subtitle = formatPackingListProfileSubtitle(list.profileSnapshot);
  const progress = formatPackingListProgress(trip, list.id);
  const accessibilityLabel = selected
    ? `${formatPackingListPickerLabel(trip, list)}, selected`
    : formatPackingListPickerLabel(trip, list);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
      <View style={[styles.iconWrap, { backgroundColor: selected ? theme.colors.primary : theme.colors.muted }]}>
        <Feather
          name="user"
          size={18}
          color={selected ? theme.colors.primaryForeground : theme.colors.primary}
        />
      </View>

      <View style={styles.copy}>
        <AppText variant="bodySemiBold">{name}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="mutedForeground">
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="caption" color="mutedForeground">
          {progress}
        </AppText>
      </View>

      {selected ? (
        <Feather name="check" size={18} color={theme.colors.primary} accessibilityElementsHidden />
      ) : (
        <Feather name="chevron-right" size={18} color={theme.colors.mutedForeground} accessibilityElementsHidden />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.95,
  },
});
