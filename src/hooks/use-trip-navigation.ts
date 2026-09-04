import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { resolveDraftResumeRoute } from '@/features/trips/utils/draft-home-display';
import { useTrips } from '@/hooks/use-trips';

export function useTripNavigation() {
  const router = useRouter();
  const {
    beginTripPackEntry,
    createNewDraft,
    getDraftById,
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
    (draftId: string) => {
      const stored = getDraftById(draftId);
      if (!stored || !resumeDraft(draftId)) {
        return;
      }

      router.push(resolveDraftResumeRoute(stored));
    },
    [getDraftById, resumeDraft, router],
  );

  return { openTrip, selectPackingListAndOpenPack, startCreateTrip, resumeDraftTrip };
}
