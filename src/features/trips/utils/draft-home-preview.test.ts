import { createDestinationFromText } from '@/domain/destination';
import { createStoredTripDraft, addStoredDraft, emptyTripDraftsState } from '@/domain/trip-drafts-state';
import {
  buildViewAllDraftsAccessibilityLabel,
  buildViewAllDraftsLabel,
  getHomeDraftPreview,
  HOME_DRAFT_PREVIEW_LIMIT,
} from '@/features/trips/utils/draft-home-preview';

describe('getHomeDraftPreview', () => {
  it('shows at most two drafts on Home', () => {
    const drafts = ['Tokyo', 'Paris', 'Lisbon', 'Oslo'].map((city) => {
      const stored = createStoredTripDraft({ destination: createDestinationFromText(city) });
      stored.updatedAt = `2026-01-0${['Tokyo', 'Paris', 'Lisbon', 'Oslo'].indexOf(city) + 1}T00:00:00.000Z`;
      return stored;
    });

    let state = emptyTripDraftsState();
    for (const stored of drafts) {
      state = addStoredDraft(state, stored);
    }

    const ordered = [...state.drafts].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const preview = getHomeDraftPreview(ordered);

    expect(preview.visibleDrafts).toHaveLength(HOME_DRAFT_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(4);
    expect(preview.hasMore).toBe(true);
    expect(preview.visibleDrafts.map((entry) => entry.draft.destination.displayName)).toEqual([
      'Oslo',
      'Lisbon',
    ]);
  });

  it('builds view-all labels from total count', () => {
    expect(buildViewAllDraftsLabel(3)).toBe('View all drafts (3)');
    expect(buildViewAllDraftsAccessibilityLabel(3)).toBe('View all 3 drafts in progress');
  });
});
