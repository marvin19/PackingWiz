import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import { buildTripsBrowseAllView, listPreviousTrips, listUpcomingTrips } from '@/domain/trip-selectors';
import { CommittedTripManagementList } from '@/features/trips/components/committed-trip-management-list';
import { DraftPlanningList } from '@/features/trips/components/draft-planning-list';
import { TripsBrowseFilterBar } from '@/features/trips/components/trips-browse-filter-bar';
import {
  parseTripsBrowseFilter,
  type TripsBrowseFilter,
} from '@/features/trips/utils/trips-browse-filter';
import { useTripNavigation } from '@/hooks/use-trip-navigation';
import { useTrips } from '@/hooks/use-trips';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function TripsBrowseScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const initialFilter = parseTripsBrowseFilter(params.filter);
  const [activeFilter, setActiveFilter] = useState<TripsBrowseFilter>(initialFilter);

  const {
    trips,
    inProgressDraftsOrdered,
    deleteDraft,
    deleteTripPermanently,
    repositoryError,
  } = useTrips();
  const { openTrip, resumeDraftTrip } = useTripNavigation();

  const allView = useMemo(
    () => buildTripsBrowseAllView(inProgressDraftsOrdered, trips),
    [inProgressDraftsOrdered, trips],
  );
  const upcomingTrips = useMemo(() => listUpcomingTrips(trips), [trips]);
  const previousTrips = useMemo(() => listPreviousTrips(trips), [trips]);

  const handleBack = useCallback(() => {
    goBackOrReplace('/(tabs)');
  }, []);

  const handleFilterChange = useCallback((filter: TripsBrowseFilter) => {
    setActiveFilter(filter);
  }, []);

  const emptyMessage = useMemo(() => {
    switch (activeFilter) {
      case 'drafts':
        return 'No drafts in progress.';
      case 'upcoming':
        return 'No upcoming trips yet.';
      case 'previous':
        return 'No previous trips yet.';
      default:
        return 'No trips yet. Start planning from the Trips tab.';
    }
  }, [activeFilter]);

  const hasContent = useMemo(() => {
    switch (activeFilter) {
      case 'drafts':
        return inProgressDraftsOrdered.length > 0;
      case 'upcoming':
        return upcomingTrips.length > 0;
      case 'previous':
        return previousTrips.length > 0;
      default:
        return (
          allView.drafts.length > 0 || allView.upcoming.length > 0 || allView.previous.length > 0
        );
    }
  }, [activeFilter, allView, inProgressDraftsOrdered.length, previousTrips.length, upcomingTrips.length]);

  return (
    <AppScreen>
      <ScreenHeader title="Trips" onBack={handleBack} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: screenPaddingHorizontal,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <TripsBrowseFilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

        {repositoryError ? (
          <AppText variant="caption" color="destructive" style={styles.errorCopy}>
            {repositoryError}
          </AppText>
        ) : null}

        {!hasContent ? (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
            {emptyMessage}
          </AppText>
        ) : null}

        {activeFilter === 'all' ? (
          <View style={styles.sections}>
            {allView.drafts.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle>Drafts</SectionTitle>
                <DraftPlanningList
                  drafts={allView.drafts}
                  onResumeDraft={resumeDraftTrip}
                  onDeleteDraft={deleteDraft}
                />
              </View>
            ) : null}

            {allView.upcoming.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle>Upcoming</SectionTitle>
                <CommittedTripManagementList
                  trips={allView.upcoming}
                  onOpenTrip={openTrip}
                  onDeleteTripPermanently={deleteTripPermanently}
                />
              </View>
            ) : null}

            {allView.previous.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle>Previous</SectionTitle>
                <CommittedTripManagementList
                  trips={allView.previous}
                  onOpenTrip={openTrip}
                  onDeleteTripPermanently={deleteTripPermanently}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {activeFilter === 'drafts' && inProgressDraftsOrdered.length > 0 ? (
          <DraftPlanningList
            drafts={inProgressDraftsOrdered}
            onResumeDraft={resumeDraftTrip}
            onDeleteDraft={deleteDraft}
          />
        ) : null}

        {activeFilter === 'upcoming' && upcomingTrips.length > 0 ? (
          <CommittedTripManagementList
            trips={upcomingTrips}
            onOpenTrip={openTrip}
            onDeleteTripPermanently={deleteTripPermanently}
          />
        ) : null}

        {activeFilter === 'previous' && previousTrips.length > 0 ? (
          <CommittedTripManagementList
            trips={previousTrips}
            onOpenTrip={openTrip}
            onDeleteTripPermanently={deleteTripPermanently}
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    gap: 16,
  },
  errorCopy: {
    lineHeight: 18,
  },
  emptyCopy: {
    lineHeight: 20,
  },
  sections: {
    gap: 28,
  },
  section: {
    gap: 10,
  },
});
