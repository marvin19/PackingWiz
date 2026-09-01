import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { insightDisplayText } from '@/domain/insight';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { durationDays, formatDisplayDate, formatRange } from '@/domain/dates';
import { categoryBreakdown, packingListBreakdownForTrip, packingStatsForTrip, shoppingCount } from '@/domain/packing-stats';
import { OverviewBagRow } from '@/features/packing/components/overview-bag-row';
import { OverviewCategoryRow } from '@/features/packing/components/overview-category-row';
import { OverviewInsightCard } from '@/features/packing/components/overview-insight-card';
import { OverviewTripStat } from '@/features/packing/components/overview-trip-stat';
import { buildEditTripHref } from '@/features/trip-edit/utils/edit-trip-navigation';
import { SummaryDetailCard } from '@/features/trip-creation/components/summary-detail-card';
import { SummarySection } from '@/features/trip-creation/components/summary-section';
import { WeatherCard } from '@/features/trip-creation/components/weather-card';
import { getAccommodationIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  getAccommodationLabel,
  getLaundryLabel,
  getPackingForLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { spacing, screenPaddingHorizontal } from '@/theme/spacing';

export function TripOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeTripId } = useTrips();

  const stats = useMemo(() => packingStatsForTrip(activeTrip), [activeTrip]);
  const listBreakdown = useMemo(
    () => (activeTrip ? packingListBreakdownForTrip(activeTrip) : []),
    [activeTrip],
  );
  const buyCount = useMemo(() => shoppingCount(activeTrip), [activeTrip]);
  const perCategory = useMemo(
    () => (activeTrip ? categoryBreakdown(activeTrip) : []),
    [activeTrip],
  );

  const handleBack = useCallback(() => {
    goBackOrReplace('/(tabs)/pack');
  }, []);

  const handleEditTrip = useCallback(() => {
    router.push(buildEditTripHref('overview'));
  }, [router]);

  if (!activeTrip) {
    const emptyMessage = activeTripId
      ? 'This trip is no longer available. Choose another trip from Trips.'
      : 'No trip selected.';

    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title="Insights" onBack={handleBack} border />
        <View style={styles.emptyBody}>
          <Feather name="star" size={32} color={theme.colors.mutedForeground} />
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
            {emptyMessage}
          </AppText>
          <PrimaryButton label="Go to Trips" onPress={() => router.navigate('/(tabs)')} />
        </View>
      </AppScreen>
    );
  }

  const packingForLabel = getPackingForLabel(
    activeTrip.packingLists.map((list) => list.profileSnapshot),
  );
  const peopleCount = activeTrip.packingLists.length;
  const days = durationDays(activeTrip.startDate, activeTrip.endDate);
  const remaining = stats.total - stats.packed;
  const tripContextIcon = getTripContextIcon(activeTrip.tripContext[0]);
  const accommodationIcon = getAccommodationIcon(activeTrip.accommodation);
  const destinationLabel = getDestinationLabel(activeTrip.destination);
  const countryLabel = getDestinationCountryLabel(activeTrip.destination);

  return (
    <AppScreen style={styles.screen}>
      <ScreenHeader title="Insights" onBack={handleBack} border />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 88 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
                {destinationLabel}
              </AppText>
              <AppText variant="bodySmall" color="mutedForeground">
                {countryLabel ? `${countryLabel} · ` : ''}
                {formatRange(activeTrip.startDate, activeTrip.endDate)}
                {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit trip"
              onPress={handleEditTrip}
              style={({ pressed }) => [
                styles.editTripAction,
                {
                  backgroundColor: theme.colors.muted,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <Feather name="edit-2" size={14} color={theme.colors.primary} />
              <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Edit trip
              </AppText>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.progressHeader}>
            <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
              Packing progress
            </AppText>
            <AppText variant="title" color="primary" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
              {stats.pct}%
            </AppText>
          </View>
          <ProgressBar
            value={stats.pct}
            accessibilityLabel={`${stats.packed} of ${stats.total} items packed`}
          />
          <AppText variant="caption" color="mutedForeground" style={styles.progressMeta}>
            {stats.packed} of {stats.total} packed
            {remaining > 0 ? ` · ${remaining} remaining` : ''}
            {buyCount > 0 ? ` · ${buyCount} to buy` : ''}
          </AppText>
          {listBreakdown.length > 1 ? (
            <View style={styles.listBreakdown}>
              {listBreakdown.map((row) => (
                <View key={row.listId} style={styles.listBreakdownRow}>
                  <AppText variant="caption" color="mutedForeground" style={styles.listBreakdownName}>
                    {row.profileName}
                  </AppText>
                  <AppText variant="caption" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                    {row.packed} of {row.total}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.statRow}>
          <OverviewTripStat value={String(days)} label={days === 1 ? 'day' : 'days'} />
          <OverviewTripStat
            value={String(peopleCount)}
            label={peopleCount === 1 ? 'person' : 'people'}
            icon={<Feather name="users" size={14} color={theme.colors.mutedForeground} />}
          />
          <OverviewTripStat
            value={String(buyCount)}
            label="to buy"
            icon={<Feather name="shopping-bag" size={14} color={theme.colors.mutedForeground} />}
          />
        </View>

        <AppText variant="caption" color="mutedForeground" style={styles.dateLine}>
          {formatDisplayDate(activeTrip.startDate)} — {formatDisplayDate(activeTrip.endDate)}
        </AppText>

        <View style={styles.factsStack}>
          <SummaryDetailCard
            icon={<Feather name={tripContextIcon} size={16} color={theme.colors.primary} />}
            title="Trip context">
            <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
              {getTripContextLabel(activeTrip.tripContext)}
            </AppText>
          </SummaryDetailCard>

          <SummaryDetailCard
            icon={<Feather name={accommodationIcon} size={16} color={theme.colors.primary} />}
            title="Staying in">
            <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
              {getAccommodationLabel(activeTrip.accommodation)}
            </AppText>
          </SummaryDetailCard>

          <SummaryDetailCard
            icon={<Feather name="users" size={16} color={theme.colors.primary} />}
            title="Packing for">
            <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
              {packingForLabel}
            </AppText>
          </SummaryDetailCard>

          <SummaryDetailCard
            icon={<Feather name="droplet" size={16} color={theme.colors.primary} />}
            title="Laundry">
            <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
              {getLaundryLabel(activeTrip.laundry)}
            </AppText>
          </SummaryDetailCard>
        </View>

        {activeTrip.insights.length > 0 ? (
          <SummarySection title="Why PackingWiz packed this">
            <View style={styles.stack}>
              {activeTrip.insights.map((insight) => (
                <OverviewInsightCard key={insight.id} text={insightDisplayText(insight)} />
              ))}
            </View>
          </SummarySection>
        ) : null}

        <View style={styles.weatherSection}>
          <WeatherCard weather={activeTrip.weather} />
        </View>

        {activeTrip.bags.length > 0 ? (
          <SummarySection title="Bags">
            <View style={styles.stack}>
              {activeTrip.bags.map((bag) => (
                <OverviewBagRow key={bag.id} bag={bag} travelers={activeTrip.travelers} />
              ))}
            </View>
          </SummarySection>
        ) : null}

        {perCategory.length > 0 ? (
          <SummarySection title="By category">
            <View style={styles.stack}>
              {perCategory.map((entry) => (
                <OverviewCategoryRow key={entry.category} progress={entry} />
              ))}
            </View>
          </SummarySection>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyScreen: {
    flex: 1,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPaddingHorizontal,
    gap: 12,
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 16,
  },
  hero: {
    marginBottom: 20,
    gap: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  editTripAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    flexShrink: 0,
  },
  progressCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  progressMeta: {
    lineHeight: 18,
  },
  listBreakdown: {
    gap: 6,
    marginTop: 4,
  },
  listBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listBreakdownName: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateLine: {
    marginBottom: 20,
    lineHeight: 18,
  },
  factsStack: {
    gap: 0,
    marginBottom: spacing.lg,
  },
  factValue: {
    lineHeight: 20,
  },
  weatherSection: {
    marginBottom: 20,
  },
  stack: {
    gap: 8,
  },
});
