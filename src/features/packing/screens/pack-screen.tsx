import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { ProgressRing, ProgressRingLabel } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { formatRange } from '@/domain/dates';
import { packingStats } from '@/domain/packing-stats';
import { AddItemSheet } from '@/features/packing/components/add-item-sheet';
import { FilterPill } from '@/features/packing/components/filter-pill';
import { PackedCelebration } from '@/features/packing/components/packed-celebration';
import { PackingCategorySection } from '@/features/packing/components/packing-category-section';
import { usePackedCelebration } from '@/features/packing/hooks/use-packed-celebration';
import {
  filterPackingItems,
  groupItemsByCategory,
  type PackingFilter,
} from '@/features/packing/utils/group-items';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function PackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip } = useTrips();

  const [filter, setFilter] = useState<PackingFilter>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  const stats = packingStats(activeTrip);
  const buyCount = activeTrip?.items.filter((item) => item.needToBuy).length ?? 0;
  const { visible: celebrate, dismiss: dismissCelebration } = usePackedCelebration(
    activeTrip?.id ?? null,
    stats.pct,
    stats.total,
  );

  const grouped = useMemo(() => {
    if (!activeTrip) {
      return [];
    }

    return groupItemsByCategory(filterPackingItems(activeTrip.items, filter));
  }, [activeTrip, filter]);

  if (!activeTrip) {
    return (
      <AppScreen style={styles.emptyScreen}>
        <Feather name="star" size={32} color={theme.colors.mutedForeground} />
        <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
          No trip selected yet. Create a trip to see your packing list.
        </AppText>
        <PrimaryButton label="Go to Trips" onPress={() => router.navigate('/(tabs)')} />
      </AppScreen>
    );
  }

  const toggleCategory = (category: string) => {
    setCollapsed((current) => ({ ...current, [category]: !current[category] }));
  };

  return (
    <AppScreen style={styles.screen}>
      <PackedCelebration
        visible={celebrate}
        trip={activeTrip}
        onDismiss={dismissCelebration}
        onViewOverview={() => {
          dismissCelebration();
          router.push('/(tabs)/pack/overview');
        }}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <AppText variant="title" numberOfLines={1} style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
              {activeTrip.destination}
            </AppText>
            <AppText variant="bodySmall" color="mutedForeground">
              {formatRange(activeTrip.startDate, activeTrip.endDate)} · {stats.packed} of {stats.total} packed
            </AppText>
          </View>
          <ProgressRing value={stats.pct}>
            <ProgressRingLabel value={stats.pct} />
          </ProgressRing>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View trip overview and insights"
          onPress={() => router.push('/(tabs)/pack/overview')}
          style={[styles.overviewButton, { backgroundColor: theme.colors.secondary }]}>
          <Feather name="list" size={14} color={theme.colors.secondaryForeground} />
          <AppText variant="caption" color="secondaryForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            View trip overview & insights
          </AppText>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <FilterPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterPill
          label={`To pack (${stats.total - stats.packed})`}
          active={filter === 'todo'}
          onPress={() => setFilter('todo')}
        />
        <FilterPill
          label={`Shopping (${buyCount})`}
          active={filter === 'buy'}
          onPress={() => setFilter('buy')}
          icon={<Feather name="shopping-bag" size={12} color={filter === 'buy' ? theme.colors.background : theme.colors.mutedForeground} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 88 },
        ]}
        showsVerticalScrollIndicator={false}>
        {filter === 'buy' && buyCount > 0 ? (
          <View style={[styles.shoppingBanner, { backgroundColor: `${theme.colors.buy}1A`, borderColor: `${theme.colors.buy}4D` }]}>
            <Feather name="shopping-bag" size={16} color={theme.colors.buyForeground} />
            <AppText variant="caption" style={{ color: theme.colors.buyForeground, flex: 1, lineHeight: 18 }}>
              These are items Trove thinks you&apos;ll need to buy before you go. Toggle any item&apos;s &quot;Need to buy&quot; to manage this list.
            </AppText>
          </View>
        ) : null}

        {activeTrip.items.length === 0 ? (
          <View style={styles.listEmpty}>
            <Feather name="star" size={28} color={theme.colors.mutedForeground} />
            <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
              Your packing list is empty. Add your first item to get started.
            </AppText>
            <PrimaryButton label="Add item" onPress={() => setAdding(true)} />
          </View>
        ) : grouped.length === 0 ? (
          <View style={styles.listEmpty}>
            <Feather name="star" size={28} color={theme.colors.mutedForeground} />
            <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
              {filter === 'buy'
                ? "Nothing on your shopping list — you're all set."
                : filter === 'todo'
                  ? 'Nothing left to pack here. Nice work!'
                  : 'Nothing here. Nice work!'}
            </AppText>
          </View>
        ) : (
          <View style={styles.sections}>
            {grouped.map(({ category, items }) => (
              <PackingCategorySection
                key={category}
                category={category}
                items={items}
                travelers={activeTrip.travelers}
                collapsed={Boolean(collapsed[category])}
                onToggleCollapsed={() => toggleCategory(category)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add item"
        onPress={() => setAdding(true)}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}>
        <Feather name="plus" size={24} color={theme.colors.primaryForeground} />
      </Pressable>

      <AddItemSheet visible={adding} onClose={() => setAdding(false)} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPaddingHorizontal,
    gap: 12,
  },
  header: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  overviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingVertical: 8,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 4,
  },
  shoppingBanner: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  listEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  sections: {
    gap: 16,
  },
  fab: {
    position: 'absolute',
    right: screenPaddingHorizontal,
    width: 56,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
