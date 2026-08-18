import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import { PackingItemRow, type PackingCheckboxIntent } from '@/features/packing/components/packing-item-row';
import { getCategoryIcon } from '@/features/packing/utils/category-icons';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';

type PackingCategorySectionProps = {
  category: PackingCategory;
  items: PackingItem[];
  travelers: Traveler[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  checkboxIntent?: PackingCheckboxIntent;
  onCheckboxPress?: (itemId: string) => void;
};

type PackingCategoryHeaderProps = {
  category: PackingCategory;
  items: PackingItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function PackingCategoryHeader({
  category,
  items,
  collapsed,
  onToggleCollapsed,
}: PackingCategoryHeaderProps) {
  const theme = useTheme();
  const icon = getCategoryIcon(category);
  const packedCount = items.filter((item) => item.packed).length;
  const allPacked = packedCount === items.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category}, ${packedCount} of ${items.length} packed`}
      accessibilityState={{ expanded: !collapsed }}
      onPress={onToggleCollapsed}
      style={styles.header}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: allPacked ? theme.colors.success : theme.colors.accent,
          },
        ]}>
        {allPacked ? (
          <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />
        ) : (
          <Feather
            name={icon}
            size={16}
            color={allPacked ? theme.colors.primaryForeground : theme.colors.accentForeground}
          />
        )}
      </View>
      <AppText
        variant="bodySmall"
        style={{
          fontFamily: theme.fontFamilies.displayExtraBold,
          color: allPacked ? theme.colors.success : theme.colors.foreground,
        }}>
        {category}
      </AppText>
      {allPacked ? (
        <View style={[styles.allPackedBadge, { backgroundColor: `${theme.colors.success}26` }]}>
          <Feather name="check-circle" size={12} color={theme.colors.success} />
          <AppText variant="micro" style={{ color: theme.colors.success, fontFamily: theme.fontFamilies.sansSemiBold }}>
            All packed
          </AppText>
        </View>
      ) : (
        <AppText variant="caption" color="mutedForeground">
          {packedCount}/{items.length}
        </AppText>
      )}
      <Feather
        name="chevron-down"
        size={16}
        color={theme.colors.mutedForeground}
        style={{ marginLeft: 'auto', transform: [{ rotate: collapsed ? '-90deg' : '0deg' }] }}
      />
    </Pressable>
  );
}

export function PackingCategorySection({
  category,
  items,
  travelers,
  collapsed,
  onToggleCollapsed,
  checkboxIntent = 'packed',
  onCheckboxPress,
}: PackingCategorySectionProps) {
  const { togglePacked } = useTrips();
  const handleCheckboxPress = onCheckboxPress ?? ((itemId: string) => togglePacked(itemId));

  return (
    <View style={styles.section}>
      <PackingCategoryHeader
        category={category}
        items={items}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {!collapsed ? (
        <View style={styles.items}>
          {items.map((item) => (
            <PackingItemRow
              key={item.id}
              item={item}
              travelers={travelers}
              checkboxIntent={checkboxIntent}
              onCheckboxPress={handleCheckboxPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allPackedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  items: {
    gap: 8,
  },
});
