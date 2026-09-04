import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { ReuseTripTravellerRow } from '@/features/trips/utils/reuse-trip-view-model';
import { useTheme } from '@/hooks/use-theme';

type ReuseTravellerSelectionProps = {
  rows: ReuseTripTravellerRow[];
  error: string | null;
  onToggle: (listId: string) => void;
  onAddPerson: () => void;
};

export function ReuseTravellerSelection({
  rows,
  error,
  onToggle,
  onAddPerson,
}: ReuseTravellerSelectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {rows.map((row) => {
        const selected = row.selected;

        return (
          <Pressable
            key={row.listId}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${row.label}, ${selected ? 'selected' : 'not selected'}`}
            onPress={() => onToggle(row.listId)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: theme.colors.card,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <Feather
              name={selected ? 'check-square' : 'square'}
              size={20}
              color={selected ? theme.colors.primary : theme.colors.mutedForeground}
            />
            <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansSemiBold }}>
              {row.label}
            </AppText>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add person"
        onPress={onAddPerson}
        style={({ pressed }) => [
          styles.addTrigger,
          { borderColor: theme.colors.border },
          pressed && styles.pressed,
        ]}>
        <Feather name="plus" size={16} color={theme.colors.primary} />
        <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          Add person
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="bodySmall" color="destructive" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  error: {
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.92,
  },
});
