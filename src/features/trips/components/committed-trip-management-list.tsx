import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { CommittedTripManagementCard } from '@/features/trips/components/committed-trip-management-card';
import { DeleteTripPermanentlyConfirmSheet } from '@/features/trips/components/delete-trip-permanently-confirm-sheet';
import { TripBrowseMenuSheet } from '@/features/trips/components/trip-browse-menu-sheet';
import { buildDeleteTripPermanentlyAccessibilityLabel } from '@/features/trips/utils/trip-delete-display';
import { buildReuseTripHref } from '@/features/trips/utils/reuse-trip-navigation';
import { performDeleteTripPermanently } from '@/features/trips/utils/trips-browse-navigation';

type CommittedTripManagementListProps = {
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
  onDeleteTripPermanently: (tripId: string) => Promise<void>;
};

export function CommittedTripManagementList({
  trips,
  onOpenTrip,
  onDeleteTripPermanently,
}: CommittedTripManagementListProps) {
  const router = useRouter();
  const [menuTripId, setMenuTripId] = useState<string | null>(null);
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState(false);

  const menuTrip = useMemo(
    () => trips.find((entry) => entry.id === menuTripId) ?? null,
    [menuTripId, trips],
  );

  const pendingDeleteTrip = useMemo(
    () => trips.find((entry) => entry.id === pendingDeleteTripId) ?? null,
    [pendingDeleteTripId, trips],
  );

  const handleConfirmDelete = async () => {
    if (!pendingDeleteTripId) {
      return;
    }

    setActionInFlight(true);
    try {
      await performDeleteTripPermanently(pendingDeleteTripId, onDeleteTripPermanently);
      setPendingDeleteTripId(null);
    } finally {
      setActionInFlight(false);
    }
  };

  if (trips.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.list}>
        {trips.map((trip) => (
          <CommittedTripManagementCard
            key={trip.id}
            trip={trip}
            onPress={onOpenTrip}
            onOpenMenu={setMenuTripId}
          />
        ))}
      </View>

      <TripBrowseMenuSheet
        visible={menuTripId !== null}
        trip={menuTrip}
        showDeletePermanently
        onClose={() => setMenuTripId(null)}
        onReuseTrip={(tripId) => router.push(buildReuseTripHref(tripId))}
        onDeletePermanently={setPendingDeleteTripId}
      />

      <DeleteTripPermanentlyConfirmSheet
        visible={pendingDeleteTripId !== null}
        confirmAccessibilityLabel={
          pendingDeleteTrip ? buildDeleteTripPermanentlyAccessibilityLabel(pendingDeleteTrip) : null
        }
        confirming={actionInFlight}
        onCancel={() => setPendingDeleteTripId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});

/** @deprecated Use CommittedTripManagementList */
export const PastTripManagementList = CommittedTripManagementList;
