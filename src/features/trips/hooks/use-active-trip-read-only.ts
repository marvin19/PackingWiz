import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isTripReadOnly } from '@/domain/trip-mutation-policy';
import type { Trip } from '@/domain/trip';
import { subscribeAppForegroundNotify } from '@/lib/app-foreground-notify';

/**
 * UI read-only flag for the active trip (PW-004E-B).
 * Re-evaluates on screen focus and when the app returns to the foreground.
 * Mutation guards in TripsProvider remain authoritative if UI is briefly stale.
 */
export function useActiveTripReadOnly(trip: Trip | null | undefined): boolean {
  const [policyTick, setPolicyTick] = useState(0);

  const bumpPolicyTick = useCallback(() => {
    setPolicyTick((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      bumpPolicyTick();
    }, [bumpPolicyTick]),
  );

  useEffect(() => subscribeAppForegroundNotify(bumpPolicyTick), [bumpPolicyTick]);

  return useMemo(() => {
    void policyTick;
    return trip ? isTripReadOnly(trip) : false;
    // policyTick forces re-evaluation against the current local calendar day.
  }, [trip, policyTick]);
}