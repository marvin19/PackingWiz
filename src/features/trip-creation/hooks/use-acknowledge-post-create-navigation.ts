import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useTrips } from '@/hooks/use-trips';

/** Clears commit-in-flight guard once Pack or list-picker actually focused (avoids Summary redirect race). */
export function useAcknowledgePostCreateNavigation() {
  const { isCommitDraftInFlight, acknowledgeCommitDraftNavigation } = useTrips();

  useFocusEffect(
    useCallback(() => {
      if (!isCommitDraftInFlight) {
        return;
      }

      acknowledgeCommitDraftNavigation();
    }, [acknowledgeCommitDraftNavigation, isCommitDraftInFlight]),
  );
}
