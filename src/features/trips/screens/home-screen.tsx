import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import { ContinueDraftCta } from '@/features/trips/components/continue-draft-cta';
import { PlanNewTripCta } from '@/features/trips/components/plan-new-trip-cta';
import { PastTripCard } from '@/features/trips/components/past-trip-card';
import { TripsEmptyState } from '@/features/trips/components/trips-empty-state';
import { UpcomingTripCard } from '@/features/trips/components/upcoming-trip-card';
import { useTripNavigation } from '@/hooks/use-trip-navigation';
import { useTrips } from '@/hooks/use-trips';
import { getTimeBasedGreeting, mockUserProfile } from '@/mocks/user-profile';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { trips, isLoading, getPrimaryInProgressDraft } = useTrips();
  const { openTrip, startCreateTrip, resumeDraftTrip } = useTripNavigation();
  const primaryDraft = getPrimaryInProgressDraft();
  const hasDraft = primaryDraft !== null;

  const upcoming = trips.filter((trip) => trip.status === 'upcoming');
  const past = trips.filter((trip) => trip.status === 'past');

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
        {hasDraft && primaryDraft ? (
          <ContinueDraftCta
            draft={primaryDraft.draft}
            onPress={() => resumeDraftTrip(primaryDraft.id)}
          />
        ) : null}
        <PlanNewTripCta onPress={startCreateTrip} />

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

        <View style={styles.section}>
          <SectionTitle>Previous trips</SectionTitle>
          {past.length === 0 ? (
            <TripsEmptyState message="Your past trips will appear here." />
          ) : (
            <View style={styles.compactList}>
              {past.map((trip) => (
                <PastTripCard key={trip.id} trip={trip} onPress={openTrip} />
              ))}
            </View>
          )}
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
    paddingTop: 4,
  },
  section: {
    marginTop: 28,
  },
  cardList: {
    gap: 16,
  },
  compactList: {
    gap: 10,
  },
});
