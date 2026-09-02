import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useTrips } from '@/hooks/use-trips';

export function useTripNavigation() {
  const router = useRouter();
  const {
    beginTripPackEntry,
    createNewDraft,
    getDraftById,
    getPrimaryInProgressDraft,
    resumeDraft,
  } = useTrips();

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
    createNewDraft();
    router.push('/trip/create');
  }, [createNewDraft, router]);

  const resumeDraftTrip = useCallback(
    (draftId?: string) => {
      const targetId = draftId ?? getPrimaryInProgressDraft()?.id;
      if (!targetId) {
        return;
      }

      const stored = getDraftById(targetId);
      if (!stored || !resumeDraft(targetId)) {
        return;
      }

      router.push(stored.reachedSummary ? '/trip/summary' : '/trip/create');
    },
    [getDraftById, getPrimaryInProgressDraft, resumeDraft, router],
  );

  return { openTrip, selectPackingListAndOpenPack, startCreateTrip, resumeDraftTrip };
}
