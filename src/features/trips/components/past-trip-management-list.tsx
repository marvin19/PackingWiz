import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { DeleteTripPermanentlyConfirmSheet } from '@/features/trips/components/delete-trip-permanently-confirm-sheet';
import { PastTripManagementCard } from '@/features/trips/components/past-trip-management-card';
import { PreviousTripMenuSheet } from '@/features/trips/components/previous-trip-menu-sheet';
import { buildDeleteTripPermanentlyAccessibilityLabel } from '@/features/trips/utils/trip-delete-display';
import { performDeleteTripPermanently } from '@/features/trips/utils/trips-browse-navigation';

type PastTripManagementListProps = {
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
  onDeleteTripPermanently: (tripId: string) => Promise<void>;
};

export function PastTripManagementList({
  trips,
  onOpenTrip,
  onDeleteTripPermanently,
}: PastTripManagementListProps) {
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
          <PastTripManagementCard
            key={trip.id}
            trip={trip}
            onPress={onOpenTrip}
            onOpenMenu={setMenuTripId}
          />
        ))}
      </View>

      <PreviousTripMenuSheet
        visible={menuTripId !== null}
        trip={menuTrip}
        onClose={() => setMenuTripId(null)}
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
