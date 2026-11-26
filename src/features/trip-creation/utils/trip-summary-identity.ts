import type { Trip } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { resolveTripDraftDisplayTitle } from '@/domain/trip-draft-naming';

export type TripSummaryTripIdentity = Pick<
  Trip,
  'name' | 'title' | 'destination' | 'isTripNameUserEdited'
>;

/** Maps in-progress creation draft fields to committed-trip identity presentation (no Trip conversion). */
export function buildTripSummaryTripIdentityFromDraft(
  draft: Pick<TripDraft, 'name' | 'destination' | 'isTripNameUserEdited'>,
): TripSummaryTripIdentity {
  const isTripNameUserEdited = draft.isTripNameUserEdited ?? Boolean(draft.name?.trim());
  const displayTitle = resolveTripDraftDisplayTitle(draft, { emptyFallback: 'Your trip' });

  return {
    name: isTripNameUserEdited ? (draft.name?.trim() ?? '') : '',
    title: displayTitle,
    destination: draft.destination,
    isTripNameUserEdited,
  };
}