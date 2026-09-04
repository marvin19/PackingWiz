import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { EditTripTravellerRow as TravellerRow } from '@/features/trip-edit/utils/edit-trip-view-model';
import { useTheme } from '@/hooks/use-theme';

type EditTripTravellerRowProps = {
  row: TravellerRow;
  onRemovePress: () => void;
};

export function EditTripTravellerRow({ row, onRemovePress }: EditTripTravellerRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name="user" size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          {row.name}
        </AppText>
        {row.subtitle ? (
          <AppText variant="caption" color="mutedForeground">
            {row.subtitle}
          </AppText>
        ) : null}
      </View>
      {row.canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${row.name} from this trip`}
          onPress={onRemovePress}
          style={({ pressed }) => [
            styles.removeAction,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <AppText variant="caption" color="destructive" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Remove
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  removeAction: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
});
