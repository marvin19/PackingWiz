import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useTrips } from '@/hooks/use-trips';

export function useTripNavigation() {
  const router = useRouter();
  const { beginTripPackEntry, resetDraft, draftReachedSummary } = useTrips();

  const openTrip = useCallback(
    (tripId: string) => {
      const destination = beginTripPackEntry(tripId);
      if (destination === 'select-list') {
        router.navigate('/(tabs)/pack/select-list');
        return;
      }

      router.navigate('/(tabs)/pack');
    },
    [beginTripPackEntry, router],
  );

  const selectPackingListAndOpenPack = useCallback(
    (tripId: string, listId: string) => {
      beginTripPackEntry(tripId, listId);
      router.replace('/(tabs)/pack');
    },
    [beginTripPackEntry, router],
  );

  const startCreateTrip = useCallback(() => {
    resetDraft();
    router.push('/trip/create');
  }, [resetDraft, router]);

  const resumeDraftTrip = useCallback(() => {
    if (draftReachedSummary) {
      router.push('/trip/summary');
      return;
    }

    router.push('/trip/create');
  }, [draftReachedSummary, router]);

  return { openTrip, selectPackingListAndOpenPack, startCreateTrip, resumeDraftTrip };
}
