import type { StoredTripDraft } from '@/domain/trip-drafts-state';

export const HOME_DRAFT_PREVIEW_LIMIT = 2;

export type HomeDraftPreview = {
  visibleDrafts: StoredTripDraft[];
  totalCount: number;
  hasMore: boolean;
};

export function getHomeDraftPreview(
  drafts: StoredTripDraft[],
  limit: number = HOME_DRAFT_PREVIEW_LIMIT,
): HomeDraftPreview {
  return {
    visibleDrafts: drafts.slice(0, limit),
    totalCount: drafts.length,
    hasMore: drafts.length > limit,
  };
}

export function buildViewAllDraftsLabel(totalCount: number): string {
  return `View all drafts (${totalCount})`;
}

export function buildViewAllDraftsAccessibilityLabel(totalCount: number): string {
  return `View all ${totalCount} drafts in progress`;
}
