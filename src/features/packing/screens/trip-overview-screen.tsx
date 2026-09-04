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
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { durationDays, formatRange } from '@/domain/dates';
import { packingListBreakdownForTrip, packingStatsForTrip, shoppingCount } from '@/domain/packing-stats';
import { TripInsightCard } from '@/features/packing/components/overview-insight-card';
import { SummarySection } from '@/features/trip-creation/components/summary-section';
import { WeatherCard } from '@/features/trip-creation/components/weather-card';
import { buildEditTripHref } from '@/features/trip-edit/utils/edit-trip-navigation';
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

  const days = durationDays(activeTrip.startDate, activeTrip.endDate);
  const remaining = stats.total - stats.packed;
  const destinationLabel = getDestinationLabel(activeTrip.destination);
  const countryLabel = getDestinationCountryLabel(activeTrip.destination);
  const hasInsights = activeTrip.insights.length > 0;

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

        <SummarySection title="Packing insights">
          {hasInsights ? (
            <View style={styles.insightsStack}>
              {activeTrip.insights.map((insight) => (
                <TripInsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.insightsEmpty,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Feather name="message-circle" size={20} color={theme.colors.mutedForeground} />
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                No packing insights yet
              </AppText>
              <AppText variant="bodySmall" color="mutedForeground" style={styles.insightsEmptyBody}>
                PackingWiz will show useful observations here when there are packing recommendations to
                explain.
              </AppText>
            </View>
          )}
        </SummarySection>

        <SummarySection title="Weather">
          <WeatherCard weather={activeTrip.weather} />
        </SummarySection>
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
    marginBottom: spacing.lg,
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
  insightsStack: {
    gap: spacing.md,
  },
  insightsEmpty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightsEmptyBody: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
