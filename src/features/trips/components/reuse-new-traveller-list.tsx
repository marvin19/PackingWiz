import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { ReuseTripNewTravellerRow } from '@/features/trips/utils/reuse-trip-view-model';
import { useTheme } from '@/hooks/use-theme';

type ReuseNewTravellerListProps = {
  rows: ReuseTripNewTravellerRow[];
  onRemove: (entryId: string) => void;
};

export function ReuseNewTravellerList({ rows, onRemove }: ReuseNewTravellerListProps) {
  const theme = useTheme();

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <View
          key={row.entryId}
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.copy}>
            <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              {row.label}
            </AppText>
            <AppText variant="caption" color="mutedForeground">
              {row.packingModeLabel}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${row.label} from reuse plan`}
            onPress={() => onRemove(row.entryId)}
            hitSlop={8}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
            <Feather name="x" size={18} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
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
  copy: {
    flex: 1,
    gap: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
