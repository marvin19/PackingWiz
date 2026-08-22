import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
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
  onOpenSettings: (itemId: string) => void;
  checkboxIntent?: PackingCheckboxIntent;
  onCheckboxPress?: (itemId: string) => void;
};

type PackingCategoryHeaderProps = {
  category: PackingCategory;
  items: PackingItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  trailing?: ReactNode;
};

export function PackingCategoryHeader({
  category,
  items,
  collapsed,
  onToggleCollapsed,
  trailing,
}: PackingCategoryHeaderProps) {
  const theme = useTheme();
  const icon = getCategoryIcon(category);
  const packedCount = items.filter((item) => item.packed).length;
  const allPacked = packedCount === items.length;
  const isImportant = category === 'Important';

  const iconBackground = isImportant
    ? `${theme.colors.important}26`
    : allPacked
      ? theme.colors.success
      : theme.colors.accent;

  const iconColor = isImportant
    ? theme.colors.important
    : allPacked
      ? theme.colors.primaryForeground
      : theme.colors.accentForeground;

  const titleColor = isImportant
    ? theme.colors.importantForeground
    : allPacked
      ? theme.colors.success
      : theme.colors.foreground;

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${category}, ${packedCount} of ${items.length} packed`}
        accessibilityState={{ expanded: !collapsed }}
        onPress={onToggleCollapsed}
        style={styles.headerMain}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          {allPacked && !isImportant ? (
            <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />
          ) : (
            <Feather name={icon} size={16} color={iconColor} />
          )}
        </View>
        <AppText
          variant="bodySmall"
          style={{
            fontFamily: theme.fontFamilies.displayExtraBold,
            color: titleColor,
          }}>
          {category}
        </AppText>
        {allPacked && !isImportant ? (
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
      </Pressable>

      <View style={styles.headerTrailing}>
        {trailing}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? `Expand ${category}` : `Collapse ${category}`}
          onPress={onToggleCollapsed}
          hitSlop={8}
          style={styles.chevronButton}>
          <Feather
            name="chevron-down"
            size={16}
            color={theme.colors.mutedForeground}
            style={{ transform: [{ rotate: collapsed ? '-90deg' : '0deg' }] }}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function PackingCategorySection({
  category,
  items,
  travelers,
  collapsed,
  onToggleCollapsed,
  onOpenSettings,
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
              onOpenSettings={onOpenSettings}
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
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
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
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronButton: {
    padding: 4,
  },
  items: {
    gap: 8,
  },
});
