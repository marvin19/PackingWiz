import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { ProgressRing, ProgressRingLabel } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { profileNeedsImportantFirstTimeSetup } from '@/domain/important-profile-setup';
import { getDestinationLabel } from '@/domain/destination';
import { formatRange } from '@/domain/dates';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import {
  isImportantSnapshotStale,
  isImportantPackingItem,
} from '@/domain/important-snapshot';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { packingStatsForList } from '@/domain/packing-stats';
import { AddItemSheet } from '@/features/packing/components/add-item-sheet';
import { PackFilterSheet } from '@/features/packing/components/pack-filter-sheet';
import {
  PackTripMenuButton,
  PackTripMenuSheet,
  type PackTripMenuAction,
} from '@/features/packing/components/pack-trip-menu-sheet';
import { ImportantNotConfiguredNotice } from '@/features/packing/components/important-not-configured-notice';
import { ImportantSnapshotNotice } from '@/features/packing/components/important-snapshot-notice';
import { PackingListPickerSheet } from '@/features/packing/components/packing-list-picker-sheet';
import { buildEditTripHref } from '@/features/trip-edit/utils/edit-trip-navigation';
import { PackedCelebration } from '@/features/packing/components/packed-celebration';
import { PackingItemSettingsSheet } from '@/features/packing/components/packing-item-settings-sheet';
import { PackingCategoryHeader } from '@/features/packing/components/packing-category-section';
import { PackingCategoryItemList } from '@/features/packing/components/packing-category-item-list';
import {
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
  data: { id: string; items: PackingItem[] }[];
};

export function PackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeTripId, activePackingList, activePackingListId, selectActivePackingList, togglePacked, markItemPurchased, syncImportantSnapshotForList } =
    useTrips();
  const {
    getImportantConfigForProfile,
    getEnabledImportantItemsForProfile,
    getImportantItemsForProfile,
    isImportantFeatureActiveForProfile,
    getImportantMasterVersionForProfile,
    resolveImportantProfileId,
    requestOpenImportantEditor,
    dismissImportantStaleNotice,
    isImportantStaleNoticeDismissed,
  } = useProfile();

  const [filter, setFilter] = useState<PackingFilter>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [importantNoticeDismissedByKey, setImportantNoticeDismissedByKey] = useState<Record<string, boolean>>({});
  const [settingsItemId, setSettingsItemId] = useState<string | null>(null);
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [tripMenuVisible, setTripMenuVisible] = useState(false);

  const hasMultipleLists = (activeTrip?.packingLists.length ?? 0) > 1;

  const activeImportantProfileId = activePackingList
    ? resolveImportantProfileId(activePackingList.profileSnapshot)
    : null;
  const activeProfileLabel = activePackingList
    ? formatPackingListProfileName(activePackingList.profileSnapshot)
    : undefined;
  const activeImportantConfig = activeImportantProfileId
    ? getImportantConfigForProfile(activeImportantProfileId)
    : null;
  const activeImportantItems = activeImportantProfileId
    ? getImportantItemsForProfile(activeImportantProfileId)
    : [];
  const activeEnabledImportantItems = activeImportantProfileId
    ? getEnabledImportantItemsForProfile(activeImportantProfileId)
    : [];
  const activeIsImportantFeatureActive = activeImportantProfileId
    ? isImportantFeatureActiveForProfile(activeImportantProfileId)
    : false;
  const activeImportantMasterVersion = activeImportantProfileId
    ? getImportantMasterVersionForProfile(activeImportantProfileId)
    : '';
  const activeImportantUpdatedAt = activeImportantConfig?.updatedAt;

  useEffect(() => {
    if (activeTrip && hasMultipleLists && !activePackingListId) {
      router.replace('/(tabs)/pack/select-list');
    }
  }, [activeTrip, activePackingListId, hasMultipleLists, router]);

  const packingItems = useMemo(
    () => activePackingList?.items ?? [],
    [activePackingList],
  );

  const settingsItem = useMemo(() => {
    if (!settingsItemId) {
      return null;
    }

    return packingItems.find((item) => item.id === settingsItemId) ?? null;
  }, [packingItems, settingsItemId]);

  const stats = packingStatsForList(activeTrip, activePackingListId);
  const buyCount = packingItems.filter((item) => item.needToBuy).length;
  const { visible: celebrate, dismiss: dismissCelebration } = usePackedCelebration(
    activeTrip?.id ?? null,
    activePackingListId,
    stats.pct,
    stats.total,
  );

  const importantNoticeKey = `${activeTrip?.id ?? 'none'}:${activeImportantProfileId ?? 'none'}`;
  const importantNoticeDismissed = importantNoticeDismissedByKey[importantNoticeKey] ?? false;

  const showImportantNotConfiguredNotice =
    Boolean(activeTrip) &&
    Boolean(activeImportantProfileId) &&
    activeImportantConfig !== null &&
    profileNeedsImportantFirstTimeSetup(activeImportantConfig) &&
    filter === 'all' &&
    !importantNoticeDismissed;

  const importantSnapshotStale = useMemo(() => {
    if (!activeTrip || !activeIsImportantFeatureActive) {
      return false;
    }

    return isImportantSnapshotStale(activeEnabledImportantItems, packingItems);
  }, [activeTrip, activeEnabledImportantItems, activeIsImportantFeatureActive, packingItems]);

  const showImportantStaleNotice = useMemo(() => {
    if (!activeTrip || !activePackingListId || !importantSnapshotStale) {
      return false;
    }

    return !isImportantStaleNoticeDismissed(
      activeTrip.id,
      activePackingListId,
      activeImportantMasterVersion,
    );
  }, [
    activeImportantMasterVersion,
    activePackingListId,
    activeTrip,
    importantSnapshotStale,
    isImportantStaleNoticeDismissed,
  ]);

  const grouped = useMemo(() => {
    if (!activeTrip) {
      return [];
    }

    const visibleItems = activeIsImportantFeatureActive
      ? packingItems
      : packingItems.filter((item) => !isImportantPackingItem(item));

    return groupItemsByCategory(filterPackingItems(visibleItems, filter));
  }, [activeTrip, activeIsImportantFeatureActive, packingItems, filter]);

  const sections = useMemo<PackSection[]>(
    () =>
      grouped.map(({ category, items }) => ({
        category,
        allItems: items,
        data: collapsed[category] ? [] : [{ id: `${category}-items`, items }],
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

  const handleOpenProfileImportant = useCallback(() => {
    if (!activeImportantProfileId) {
      return;
    }

    requestOpenImportantEditor(activeImportantProfileId);
    router.navigate('/(tabs)/profile');
  }, [activeImportantProfileId, requestOpenImportantEditor, router]);

  const handleUpdateImportantSnapshot = useCallback(() => {
    if (!activeTrip || !activePackingListId) {
      return;
    }

    syncImportantSnapshotForList(activeTrip.id, activePackingListId, activeImportantItems);
  }, [activeImportantItems, activePackingListId, activeTrip, syncImportantSnapshotForList]);

  const handleKeepImportantSnapshot = useCallback(() => {
    if (!activeTrip || !activePackingListId) {
      return;
    }

    dismissImportantStaleNotice(activeTrip.id, activePackingListId, activeImportantMasterVersion);
  }, [
    activeImportantMasterVersion,
    activePackingListId,
    activeTrip,
    dismissImportantStaleNotice,
  ]);

  const handleOpenItemSettings = useCallback(
    (itemId: string) => {
      const item = packingItems.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      setSettingsItemId(itemId);
    },
    [packingItems],
  );

  const handleCloseItemSettings = useCallback(() => {
    setSettingsItemId(null);
  }, []);

  const handleSelectPackingList = useCallback(
    (listId: string) => {
      selectActivePackingList(listId);
      setSettingsItemId(null);
    },
    [selectActivePackingList],
  );

  const handleTripMenuAction = useCallback(
    (action: PackTripMenuAction) => {
      switch (action) {
        case 'back-to-trips':
          router.navigate('/(tabs)');
          return;
        case 'filter':
          setFilterVisible(true);
          return;
        case 'insights':
          router.push('/(tabs)/pack/overview');
          return;
        case 'edit-trip':
          router.push(buildEditTripHref('pack'));
          return;
      }
    },
    [router],
  );

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

  const listEmpty = packingItems.length === 0 || grouped.length === 0;
  const activeListName = activePackingList
    ? formatPackingListProfileName(activePackingList.profileSnapshot)
    : '';

  return (
    <AppScreen style={styles.screen}>
      <PackedCelebration
        visible={celebrate}
        trip={activeTrip}
        itemCount={stats.total}
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
            <View style={styles.headerMetaRow}>
              <AppText variant="bodySmall" color="mutedForeground" style={styles.headerMetaCopy}>
                {formatRange(activeTrip.startDate, activeTrip.endDate)} · {stats.packed} of {stats.total} packed
              </AppText>
            </View>
          </View>
          <ProgressRing value={stats.pct}>
            <ProgressRingLabel value={stats.pct} />
          </ProgressRing>
        </View>

        <View style={styles.headerToolbarRow}>
          {activePackingList ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                hasMultipleLists
                  ? `Packing for ${activeListName}. Switch packing list.`
                  : `Packing for ${activeListName}`
              }
              onPress={hasMultipleLists ? () => setListPickerVisible(true) : undefined}
              disabled={!hasMultipleLists}
              style={({ pressed }) => [
                styles.listSwitcher,
                !hasMultipleLists && styles.listSwitcherStatic,
                hasMultipleLists && pressed && styles.pressed,
              ]}>
              <AppText variant="caption" color="mutedForeground">
                Packing for:
              </AppText>
              <AppText
                variant="bodySemiBold"
                numberOfLines={1}
                style={styles.listSwitcherName}>
                {activeListName}
              </AppText>
              {hasMultipleLists ? (
                <Feather name="chevron-down" size={14} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          ) : null}

          <PackTripMenuButton onPress={() => setTripMenuVisible(true)} />
        </View>
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
            {showImportantNotConfiguredNotice && activeProfileLabel ? (
              <ImportantNotConfiguredNotice
                profileLabel={activeProfileLabel}
                onOpenProfile={handleOpenProfileImportant}
                onDismiss={() =>
                  setImportantNoticeDismissedByKey((current) => ({
                    ...current,
                    [importantNoticeKey]: true,
                  }))
                }
              />
            ) : null}
            {showImportantStaleNotice && !hasImportantSection ? (
              <ImportantSnapshotNotice
                profileLabel={activeProfileLabel}
                updatedAt={activeImportantUpdatedAt}
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
            <Feather name="briefcase" size={28} color={theme.colors.mutedForeground} />
            {packingItems.length === 0 ? (
              <>
                <AppText variant="bodySemiBold" style={styles.emptyTitle}>
                  Your packing list is empty
                </AppText>
                <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
                  Add your first item to start packing.
                </AppText>
                <PrimaryButton label="Add item" onPress={() => setAdding(true)} />
              </>
            ) : (
              <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
                {filter === 'buy'
                  ? "Nothing on your shopping list — you're all set."
                  : filter === 'todo'
                    ? 'Nothing left to pack here. Nice work!'
                    : 'Nothing here. Nice work!'}
              </AppText>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View>
            {section.category === 'Important' && showImportantStaleNotice ? (
              <ImportantSnapshotNotice
                profileLabel={activeProfileLabel}
                updatedAt={activeImportantUpdatedAt}
                onUpdate={handleUpdateImportantSnapshot}
                onKeepCurrent={handleKeepImportantSnapshot}
              />
            ) : null}
            <PackingCategoryHeader
              category={section.category}
              items={section.allItems}
              collapsed={Boolean(collapsed[section.category])}
              onToggleCollapsed={() => toggleCategory(section.category)}
            />
          </View>
        )}
        renderItem={({ item, section }) => (
          <PackingCategoryItemList
            category={section.category}
            items={item.items}
            travelers={activeTrip.travelers}
            checkboxIntent={checkboxIntent}
            onCheckboxPress={handleCheckboxPress}
            onOpenSettings={handleOpenItemSettings}
          />
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
      {settingsItem ? (
        <PackingItemSettingsSheet
          key={settingsItem.id}
          item={settingsItem}
          travelers={activeTrip.travelers}
          visible
          onClose={handleCloseItemSettings}
        />
      ) : null}

      {hasMultipleLists && activeTrip ? (
        <PackingListPickerSheet
          visible={listPickerVisible}
          trip={activeTrip}
          selectedListId={activePackingListId}
          onSelect={handleSelectPackingList}
          onClose={() => setListPickerVisible(false)}
        />
      ) : null}

      <PackFilterSheet
        visible={filterVisible}
        activeFilter={filter}
        todoCount={stats.total - stats.packed}
        buyCount={buyCount}
        onSelect={setFilter}
        onClose={() => setFilterVisible(false)}
      />

      <PackTripMenuSheet
        visible={tripMenuVisible}
        activeFilter={filter}
        onSelect={handleTripMenuAction}
        onClose={() => setTripMenuVisible(false)}
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
    paddingBottom: 8,
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMetaCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerToolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    rowGap: 6,
  },
  listSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
    paddingVertical: 4,
    paddingRight: 4,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  listSwitcherStatic: {
    opacity: 1,
  },
  listSwitcherName: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.85,
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
    lineHeight: 18,
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
  emptyTitle: {
    textAlign: 'center',
  },
  sectionGap: {
    height: 8,
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
