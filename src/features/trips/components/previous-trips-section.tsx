import { StyleSheet, View } from 'react-native';

import { SectionTitle } from '@/components/ui/section-title';
import type { Trip } from '@/domain/trip';
import { HomeViewAllLink } from '@/features/trips/components/home-view-all-link';
import { PastTripCard } from '@/features/trips/components/past-trip-card';
import {
  buildViewAllPreviousTripsAccessibilityLabel,
  buildViewAllPreviousTripsLabel,
  getHomePreviousPreview,
} from '@/features/trips/utils/previous-home-preview';

type PreviousTripsSectionProps = {
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
  onViewAllPrevious?: () => void;
};

export function PreviousTripsSection({
  trips,
  onOpenTrip,
  onViewAllPrevious,
}: PreviousTripsSectionProps) {
  const { visibleTrips, totalCount, hasMore } = getHomePreviousPreview(trips);

  if (totalCount === 0) {
    return null;
  }

  return (
    <View>
      <SectionTitle>Previous trips</SectionTitle>
      <View style={styles.compactList}>
        {visibleTrips.map((trip) => (
          <PastTripCard key={trip.id} trip={trip} onPress={onOpenTrip} />
        ))}
      </View>

      {hasMore && onViewAllPrevious ? (
        <HomeViewAllLink
          contextual
          label={buildViewAllPreviousTripsLabel(totalCount)}
          accessibilityLabel={buildViewAllPreviousTripsAccessibilityLabel(totalCount)}
          onPress={onViewAllPrevious}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compactList: {
    gap: 10,
  },
});
