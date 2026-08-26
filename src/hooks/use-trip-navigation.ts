import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useTrips } from '@/hooks/use-trips';

export function useTripNavigation() {
  const router = useRouter();
  const { openPackingList, resetDraft, draftReachedSummary } = useTrips();

  const openTrip = useCallback(
    (tripId: string) => {
      openPackingList(tripId);
      router.navigate('/(tabs)/pack');
    },
    [router, openPackingList],
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

  return { openTrip, startCreateTrip, resumeDraftTrip };
}
