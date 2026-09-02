import { StyleSheet, View } from 'react-native';

import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import {
  PackingItemRow,
  type PackingCheckboxIntent,
} from '@/features/packing/components/packing-item-row';
import {
  PACKING_CATEGORY_CONTAINER_RADIUS,
  PACKING_ITEM_CARD_PADDING_HORIZONTAL,
} from '@/features/packing/components/packing-list-layout';
import { useTheme } from '@/hooks/use-theme';

type PackingCategoryItemListProps = {
  category: PackingCategory;
  items: PackingItem[];
  travelers: Traveler[];
  checkboxIntent: PackingCheckboxIntent;
  onCheckboxPress: (itemId: string) => void;
  onOpenSettings: (itemId: string) => void;
};

export function PackingCategoryItemList({
  category,
  items,
  travelers,
  checkboxIntent,
  onCheckboxPress,
  onOpenSettings,
}: PackingCategoryItemListProps) {
  const theme = useTheme();
  const isImportant = category === 'Important';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: isImportant ? `${theme.colors.important}66` : theme.colors.border,
        },
      ]}>
      {items.map((item, index) => (
        <View key={item.id}>
          <PackingItemRow
            item={item}
            travelers={travelers}
            checkboxIntent={checkboxIntent}
            onCheckboxPress={onCheckboxPress}
            onOpenSettings={onOpenSettings}
          />
          {index < items.length - 1 ? (
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.colors.border,
                  marginLeft: PACKING_ITEM_CARD_PADDING_HORIZONTAL,
                  marginRight: PACKING_ITEM_CARD_PADDING_HORIZONTAL,
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PACKING_CATEGORY_CONTAINER_RADIUS,
    overflow: 'hidden',
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
