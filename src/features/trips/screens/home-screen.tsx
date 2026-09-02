import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import { listPreviousTrips, listUpcomingTrips } from '@/domain/trip-selectors';
import { ContinuePlanningSection } from '@/features/trips/components/continue-planning-section';
import { PlanNewTripCta } from '@/features/trips/components/plan-new-trip-cta';
import { PreviousTripsSection } from '@/features/trips/components/previous-trips-section';
import { TripsEmptyState } from '@/features/trips/components/trips-empty-state';
import { UpcomingTripCard } from '@/features/trips/components/upcoming-trip-card';
import { HomeViewAllLink, VIEW_ALL_TRIPS_ACCESSIBILITY_LABEL, VIEW_ALL_TRIPS_LABEL } from '@/features/trips/components/home-view-all-link';
import {
  HOME_AFTER_DRAFTS_SPACING,
  HOME_FOOTER_SPACING,
  HOME_SCROLL_TOP_PADDING,
  HOME_SECTION_SPACING,
} from '@/features/trips/utils/home-screen-spacing';
import { buildTripsBrowseHref } from '@/features/trips/utils/trips-browse-navigation';
import { useTripNavigation } from '@/hooks/use-trip-navigation';
import { useTrips } from '@/hooks/use-trips';
import { getTimeBasedGreeting, mockUserProfile } from '@/mocks/user-profile';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, isLoading, inProgressDraftsOrdered, deleteDraft } = useTrips();
  const { openTrip, startCreateTrip, resumeDraftTrip } = useTripNavigation();

  const upcoming = listUpcomingTrips(trips);
  const hasDrafts = inProgressDraftsOrdered.length > 0;
  const hasPrevious = listPreviousTrips(trips).length > 0;

  if (isLoading) {
    return (
      <AppScreen style={styles.loading}>
        <ActivityIndicator size="large" />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingHorizontal: screenPaddingHorizontal,
          },
        ]}>
        <View style={styles.headerRow}>
          <BrandMark />
          <View style={styles.headerCopy}>
            <AppText variant="bodySmall" color="mutedForeground">
              {getTimeBasedGreeting()}, {mockUserProfile.firstName}
            </AppText>
            <AppText variant="subheading">Where to next?</AppText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: screenPaddingHorizontal,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {hasDrafts ? (
          <ContinuePlanningSection
            drafts={inProgressDraftsOrdered}
            onResumeDraft={resumeDraftTrip}
            onDeleteDraft={deleteDraft}
            onViewAllDrafts={() => router.push(buildTripsBrowseHref('drafts'))}
          />
        ) : null}

        <View style={hasDrafts ? styles.afterDrafts : undefined}>
          <PlanNewTripCta onPress={startCreateTrip} />
        </View>

        <View style={styles.section}>
          <SectionTitle>Upcoming</SectionTitle>
          {upcoming.length === 0 ? (
            <TripsEmptyState message="No upcoming trips yet. Plan your next adventure above." />
          ) : (
            <View style={styles.cardList}>
              {upcoming.map((trip) => (
                <UpcomingTripCard key={trip.id} trip={trip} onPress={openTrip} />
              ))}
            </View>
          )}
        </View>

        {hasPrevious ? (
          <View style={styles.section}>
            <PreviousTripsSection
              trips={trips}
              onOpenTrip={openTrip}
              onViewAllPrevious={() => router.push(buildTripsBrowseHref('previous'))}
            />
          </View>
        ) : null}

        <View style={styles.footer}>
          <HomeViewAllLink
            label={VIEW_ALL_TRIPS_LABEL}
            accessibilityLabel={VIEW_ALL_TRIPS_ACCESSIBILITY_LABEL}
            onPress={() => router.push(buildTripsBrowseHref('all'))}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  scrollContent: {
    paddingTop: HOME_SCROLL_TOP_PADDING,
  },
  afterDrafts: {
    marginTop: HOME_AFTER_DRAFTS_SPACING,
  },
  section: {
    marginTop: HOME_SECTION_SPACING,
  },
  cardList: {
    gap: 16,
  },
  footer: {
    marginTop: HOME_FOOTER_SPACING,
    alignItems: 'center',
  },
});
