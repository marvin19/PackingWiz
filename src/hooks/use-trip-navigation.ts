import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useTrips } from '@/hooks/use-trips';

export function useTripNavigation() {
  const router = useRouter();
  const { setActiveTripId, resetDraft } = useTrips();

  const openTrip = useCallback(
    (tripId: string) => {
      setActiveTripId(tripId);
      router.navigate('/(tabs)/pack');
    },
    [router, setActiveTripId],
  );

  const startCreateTrip = useCallback(() => {
    resetDraft();
    router.push('/trip/create');
  }, [resetDraft, router]);

  return { openTrip, startCreateTrip };
}
