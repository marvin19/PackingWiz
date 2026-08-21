import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { ProgressRing, ProgressRingLabel } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getDestinationLabel } from '@/domain/destination';
import { formatRange } from '@/domain/dates';
import {
  isImportantSnapshotStale,
  isImportantPackingItem,
} from '@/domain/important-snapshot';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { packingStats } from '@/domain/packing-stats';
import { AddItemSheet } from '@/features/packing/components/add-item-sheet';
import { FilterPill } from '@/features/packing/components/filter-pill';
import { ImportantItemsEmptyCard } from '@/features/packing/components/important-items-empty-card';
import { ImportantItemsSetupSheet } from '@/features/packing/components/important-items-setup-sheet';
import { ImportantSnapshotNotice } from '@/features/packing/components/important-snapshot-notice';
import { PackedCelebration } from '@/features/packing/components/packed-celebration';
import { PackingCategoryHeader } from '@/features/packing/components/packing-category-section';
import {
  PackingItemRow,
  type PackingCheckboxIntent,
} from '@/features/packing/components/packing-item-row';
import { usePackedCelebration } from '@/features/packing/hooks/use-packed-celebration';
import {
  filterPackingItems,
  groupItemsByCategory,
  type PackingFilter,
} from '@/features/packing/utils/group-items';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';
import { fabShadow } from '@/theme/shadows';

type PackSection = {
  category: PackingCategory;
  allItems: PackingItem[];
  data: PackingItem[];
};

export function PackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeTripId, togglePacked, markItemPurchased, injectImportantItemsIntoTrip, syncImportantSnapshotForTrip } =
    useTrips();
  const {
    importantItems,
    enabledImportantItems,
    isImportantConfigured,
    isImportantFeatureActive,
    importantPromptDismissed,
    importantMasterVersion,
    importantUpdatedAt,
    saveImportantItems,
    dismissImportantPrompt,
    requestOpenImportantEditor,
    dismissImportantStaleNotice,
    isImportantStaleNoticeDismissed,
  } = useProfile();

  const [filter, setFilter] = useState<PackingFilter>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [importantSetupVisible, setImportantSetupVisible] = useState(false);
  const [dismissNoticeVisible, setDismissNoticeVisible] = useState(false);

  const stats = packingStats(activeTrip);
  const buyCount = activeTrip?.items.filter((item) => item.needToBuy).length ?? 0;
  const { visible: celebrate, dismiss: dismissCelebration } = usePackedCelebration(
    activeTrip?.id ?? null,
    stats.pct,
    stats.total,
  );

  const showImportantSetup =
    Boolean(activeTrip) && !isImportantConfigured && !importantPromptDismissed && filter === 'all';

  const importantSnapshotStale = useMemo(() => {
    if (!activeTrip || !isImportantFeatureActive) {
      return false;
    }

    return isImportantSnapshotStale(enabledImportantItems, activeTrip.items);
  }, [activeTrip, enabledImportantItems, isImportantFeatureActive]);

  const showImportantStaleNotice = useMemo(() => {
    if (!activeTrip || !importantSnapshotStale) {
      return false;
    }

    return !isImportantStaleNoticeDismissed(activeTrip.id, importantMasterVersion);
  }, [
    activeTrip,
    importantMasterVersion,
    importantSnapshotStale,
    isImportantStaleNoticeDismissed,
  ]);

  const grouped = useMemo(() => {
    if (!activeTrip) {
      return [];
    }

    const visibleItems = isImportantFeatureActive
      ? activeTrip.items
      : activeTrip.items.filter((item) => !isImportantPackingItem(item));

    return groupItemsByCategory(filterPackingItems(visibleItems, filter));
  }, [activeTrip, filter, isImportantFeatureActive]);

  const sections = useMemo<PackSection[]>(
    () =>
      grouped.map(({ category, items }) => ({
        category,
        allItems: items,
        data: collapsed[category] ? [] : items,
      })),
    [grouped, collapsed],
  );

  const hasImportantSection = useMemo(
    () => grouped.some((entry) => entry.category === 'Important'),
    [grouped],
  );

  const checkboxIntent: PackingCheckboxIntent = filter === 'buy' ? 'purchased' : 'packed';

  const handleCheckboxPress = useCallback(
    (itemId: string) => {
      if (filter === 'buy') {
        markItemPurchased(itemId);
        return;
      }

      togglePacked(itemId);
    },
    [filter, markItemPurchased, togglePacked],
  );

  const handleSaveImportantItems = useCallback(
    (names: string[]) => {
      if (!activeTrip) {
        return;
      }

      const savedItems = saveImportantItems(names);
      injectImportantItemsIntoTrip(activeTrip.id, savedItems);
    },
    [activeTrip, injectImportantItemsIntoTrip, saveImportantItems],
  );

  const handleDismissImportant = useCallback(() => {
    dismissImportantPrompt();
    setDismissNoticeVisible(true);
  }, [dismissImportantPrompt]);

  const handleOpenProfileImportant = useCallback(() => {
    requestOpenImportantEditor();
    router.navigate('/(tabs)/profile');
  }, [requestOpenImportantEditor, router]);

  const handleManageImportant = useCallback(() => {
    handleOpenProfileImportant();
  }, [handleOpenProfileImportant]);

  const handleUpdateImportantSnapshot = useCallback(() => {
    if (!activeTrip) {
      return;
    }

    syncImportantSnapshotForTrip(activeTrip.id, importantItems);
  }, [activeTrip, importantItems, syncImportantSnapshotForTrip]);

  const handleKeepImportantSnapshot = useCallback(() => {
    if (!activeTrip) {
      return;
    }

    dismissImportantStaleNotice(activeTrip.id, importantMasterVersion);
  }, [activeTrip, dismissImportantStaleNotice, importantMasterVersion]);

  if (!activeTrip) {
    const isMissingActiveTrip = Boolean(activeTripId);

    return (
      <AppScreen style={styles.emptyScreen}>
        <Feather name="briefcase" size={32} color={theme.colors.mutedForeground} />
        <AppText
          variant="subheading"
          style={{ fontFamily: theme.fontFamilies.displayExtraBold, textAlign: 'center' }}>
          {isMissingActiveTrip ? 'Trip unavailable' : 'No trip selected'}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
          {isMissingActiveTrip
            ? 'This trip is no longer available. Choose another trip from Trips.'
            : 'Choose a trip to view and manage its packing list.'}
        </AppText>
        <PrimaryButton label="Go to trips" onPress={() => router.navigate('/(tabs)')} />
      </AppScreen>
    );
  }

  const toggleCategory = (category: string) => {
    setCollapsed((current) => ({ ...current, [category]: !current[category] }));
  };

  const listEmpty = activeTrip.items.length === 0 || grouped.length === 0;

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
              {getDestinationLabel(activeTrip.destination)}
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          listEmpty && styles.listContentEmpty,
          { paddingBottom: Math.max(insets.bottom, 24) + 88 },
        ]}
        ListHeaderComponent={
          <>
            {dismissNoticeVisible ? (
              <View style={[styles.noticeBanner, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.border }]}>
                <View style={styles.noticeCopy}>
                  <AppText variant="caption" color="secondaryForeground">
                    Important items hidden. You can enable them anytime from{' '}
                  </AppText>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Open Profile important items"
                    onPress={handleOpenProfileImportant}
                    hitSlop={4}>
                    <AppText
                      variant="caption"
                      color="primary"
                      style={{ fontFamily: theme.fontFamilies.sansSemiBold, textDecorationLine: 'underline' }}>
                      Profile
                    </AppText>
                  </Pressable>
                  <AppText variant="caption" color="secondaryForeground">
                    .
                  </AppText>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notice" onPress={() => setDismissNoticeVisible(false)}>
                  <Feather name="x" size={14} color={theme.colors.mutedForeground} />
                </Pressable>
              </View>
            ) : null}
            {showImportantSetup ? (
              <ImportantItemsEmptyCard
                onAdd={() => setImportantSetupVisible(true)}
                onDismiss={handleDismissImportant}
              />
            ) : null}
            {showImportantStaleNotice && !hasImportantSection ? (
              <ImportantSnapshotNotice
                updatedAt={importantUpdatedAt}
                onUpdate={handleUpdateImportantSnapshot}
                onKeepCurrent={handleKeepImportantSnapshot}
              />
            ) : null}
            {filter === 'buy' && buyCount > 0 ? (
              <View style={[styles.shoppingBanner, { backgroundColor: `${theme.colors.buy}1A`, borderColor: `${theme.colors.buy}4D` }]}>
                <Feather name="shopping-bag" size={16} color={theme.colors.buyForeground} />
                <AppText variant="caption" style={{ color: theme.colors.buyForeground, flex: 1, lineHeight: 18 }}>
                  These are items Trove thinks you&apos;ll need to buy before you go. Toggle any item&apos;s &quot;Need to buy&quot; to manage this list.
                </AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <Feather name="star" size={28} color={theme.colors.mutedForeground} />
            <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
              {activeTrip.items.length === 0
                ? 'Your packing list is empty. Add your first item to get started.'
                : filter === 'buy'
                  ? "Nothing on your shopping list — you're all set."
                  : filter === 'todo'
                    ? 'Nothing left to pack here. Nice work!'
                    : 'Nothing here. Nice work!'}
            </AppText>
            {activeTrip.items.length === 0 ? (
              <PrimaryButton label="Add item" onPress={() => setAdding(true)} />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View>
            {section.category === 'Important' && showImportantStaleNotice ? (
              <ImportantSnapshotNotice
                updatedAt={importantUpdatedAt}
                onUpdate={handleUpdateImportantSnapshot}
                onKeepCurrent={handleKeepImportantSnapshot}
              />
            ) : null}
            <PackingCategoryHeader
              category={section.category}
              items={section.allItems}
              collapsed={Boolean(collapsed[section.category])}
              onToggleCollapsed={() => toggleCategory(section.category)}
              trailing={
                section.category === 'Important' && isImportantConfigured ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Manage important items in Profile"
                    onPress={handleManageImportant}
                    style={({ pressed }) => [styles.manageLink, pressed && styles.pressed]}>
                    <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                      Manage
                    </AppText>
                  </Pressable>
                ) : null
              }
            />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <PackingItemRow
              item={item}
              travelers={activeTrip.travelers}
              checkboxIntent={checkboxIntent}
              onCheckboxPress={handleCheckboxPress}
            />
          </View>
        )}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
      />

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
          fabShadow(),
        ]}>
        <Feather name="plus" size={24} color={theme.colors.primaryForeground} />
      </Pressable>

      <AddItemSheet visible={adding} onClose={() => setAdding(false)} />
      <ImportantItemsSetupSheet
        visible={importantSetupVisible}
        initialNames={[]}
        onClose={() => setImportantSetupVisible(false)}
        onSave={handleSaveImportantItems}
      />
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
  listContentEmpty: {
    flexGrow: 1,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeCopy: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 2,
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
  itemWrap: {
    marginBottom: 8,
  },
  sectionGap: {
    height: 8,
  },
  manageLink: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  fab: {
    position: 'absolute',
    right: screenPaddingHorizontal,
    width: 56,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
