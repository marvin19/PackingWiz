import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { resolveActiveDraftIdForMutation } from '@/domain/trip-drafts-state';
import { shouldRedirectFromDraftRoute } from '@/features/trip-creation/utils/draft-route-guard';
import { useTrips } from '@/hooks/use-trips';

/**
 * Redirects to Trips/Home when Create Trip or Summary is opened without a valid
 * active draft (stale link / refresh). Never auto-selects another draft.
 *
 * Skips redirect while a draft commit is in flight (post-create Pack navigation).
 * Only evaluates while the screen is focused (Summary underneath Generating is ignored).
 */
export function useRequireActiveDraftRoute(): boolean {
  const router = useRouter();
  const { drafts, activeDraftId, isCommitDraftInFlight } = useTrips();

  const hasValidActiveDraft = useMemo(
    () => resolveActiveDraftIdForMutation({ drafts, activeDraftId }) !== null,
    [drafts, activeDraftId],
  );

  useFocusEffect(
    useCallback(() => {
      if (
        !shouldRedirectFromDraftRoute({
          isFocused: true,
          hasValidActiveDraft,
          isCommitDraftInFlight,
        })
      ) {
        return;
      }

      router.replace('/(tabs)');
    }, [hasValidActiveDraft, isCommitDraftInFlight, router]),
  );

  return hasValidActiveDraft || isCommitDraftInFlight;
}
