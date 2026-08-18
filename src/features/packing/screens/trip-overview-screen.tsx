import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { durationDays, formatDisplayDate, formatRange } from '@/domain/dates';
import {
  categoryBreakdown,
  packingStats,
  shoppingCount,
  travelerBreakdown,
} from '@/domain/packing-stats';
import { OverviewBagRow } from '@/features/packing/components/overview-bag-row';
import { OverviewCategoryRow } from '@/features/packing/components/overview-category-row';
import { OverviewInsightCard } from '@/features/packing/components/overview-insight-card';
import { OverviewTravelerRow } from '@/features/packing/components/overview-traveler-row';
import { OverviewTripStat } from '@/features/packing/components/overview-trip-stat';
import { SummarySection } from '@/features/trip-creation/components/summary-section';
import { TripFact } from '@/features/trip-creation/components/trip-fact';
import { WeatherCard } from '@/features/trip-creation/components/weather-card';
import { getAccommodationIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  getAccommodationLabel,
  getLaundryLabel,
  getTripTypeLabels,
} from '@/features/trip-creation/utils/summary-labels';
import { getTripTypeIcon } from '@/features/trips/utils/trip-type-icon';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function TripOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip } = useTrips();

  const stats = useMemo(() => packingStats(activeTrip), [activeTrip]);
  const buyCount = useMemo(() => shoppingCount(activeTrip), [activeTrip]);
  const perCategory = useMemo(
    () => (activeTrip ? categoryBreakdown(activeTrip) : []),
    [activeTrip],
  );
  const perTraveler = useMemo(
    () => (activeTrip ? travelerBreakdown(activeTrip) : []),
    [activeTrip],
  );

  if (!activeTrip) {
    return (
      <AppScreen style={styles.emptyScreen}>
        <ScreenHeader title="Trip overview" onBack={() => router.back()} border />
        <View style={styles.emptyBody}>
          <Feather name="star" size={32} color={theme.colors.mutedForeground} />
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
            No trip selected.
          </AppText>
          <PrimaryButton label="Go to Trips" onPress={() => router.navigate('/(tabs)')} />
        </View>
      </AppScreen>
    );
  }

  const days = durationDays(activeTrip.startDate, activeTrip.endDate);
  const remaining = stats.total - stats.packed;
  const firstType = activeTrip.types[0] ?? 'vacation';
  const typeIcon = getTripTypeIcon(firstType);
  const accommodationIcon = getAccommodationIcon(activeTrip.accommodation);
  const multiTraveler = activeTrip.travelers.length > 1;
  const activitiesLabel =
    activeTrip.activities.length > 0 ? activeTrip.activities.join(', ') : 'None selected';

  return (
    <AppScreen style={styles.screen}>
      <ScreenHeader title="Trip overview" onBack={() => router.back()} border />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 88 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
            {activeTrip.destination}
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground">
            {activeTrip.country ? `${activeTrip.country} · ` : ''}
            {formatRange(activeTrip.startDate, activeTrip.endDate)}
            {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
          </AppText>
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
        </View>

        <View style={styles.statRow}>
          <OverviewTripStat value={String(days)} label={days === 1 ? 'day' : 'days'} />
          <OverviewTripStat
            value={String(activeTrip.travelers.length)}
            label="travelers"
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

        <View style={styles.factsGrid}>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name={typeIcon} size={16} color={theme.colors.mutedForeground} />}
              label={activeTrip.types.length > 1 ? 'Trip types' : 'Trip type'}
              value={getTripTypeLabels(activeTrip.types)}
            />
            <TripFact
              icon={<Feather name={accommodationIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Staying in"
              value={getAccommodationLabel(activeTrip.accommodation)}
            />
          </View>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name="droplet" size={16} color={theme.colors.mutedForeground} />}
              label="Laundry"
              value={getLaundryLabel(activeTrip.laundry)}
            />
            <TripFact
              icon={<Feather name="award" size={16} color={theme.colors.mutedForeground} />}
              label="Activities"
              value={activitiesLabel}
            />
          </View>
        </View>

        {activeTrip.insights.length > 0 ? (
          <SummarySection title="Why Trove packed this">
            <View style={styles.stack}>
              {activeTrip.insights.map((insight, index) => (
                <OverviewInsightCard key={`${index}-${insight}`} text={insight} />
              ))}
            </View>
          </SummarySection>
        ) : null}

        <View style={styles.weatherSection}>
          <WeatherCard weather={activeTrip.weather} />
        </View>

        {multiTraveler && perTraveler.length > 0 ? (
          <SummarySection title="By traveler">
            <View style={styles.stack}>
              {perTraveler.map((entry) => (
                <OverviewTravelerRow key={entry.id} progress={entry} />
              ))}
            </View>
          </SummarySection>
        ) : null}

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
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateLine: {
    marginBottom: 20,
    lineHeight: 18,
  },
  factsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  factsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherSection: {
    marginBottom: 20,
  },
  stack: {
    gap: 8,
  },
});
