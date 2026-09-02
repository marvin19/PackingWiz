import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  listInProgressDraftsOrdered,
} from '@/domain/trip-drafts-state';
import {
  buildDraftCardAccessibilityLabel,
  buildDraftDeleteAccessibilityLabel,
  DRAFT_HOME_DATES_NOT_ADDED,
  DRAFT_HOME_FALLBACK_TITLE,
  getDraftDateRangeLabel,
  getDraftDisplayTitle,
  getDraftMetadataLine,
  getDraftPeopleCountLabel,
  getDraftWizardProgressLabel,
  resolveDraftResumeRoute,
  resolveDraftSaveAndCloseRoute,
} from '@/features/trips/utils/draft-home-display';

describe('draft home display labels', () => {
  it('prefers destination as the draft title', () => {
    const draft = createEmptyTripDraft();
    draft.destination = createDestinationFromText('Tokyo & Kyoto');

    expect(getDraftDisplayTitle(draft)).toBe('Tokyo & Kyoto');
  });

  it('falls back to New trip when destination is empty', () => {
    expect(getDraftDisplayTitle(createEmptyTripDraft())).toBe(DRAFT_HOME_FALLBACK_TITLE);
  });

  it('formats date range and people count with correct singular/plural', () => {
    const draft = createEmptyTripDraft();
    draft.destination = createDestinationFromText('Lisbon');
    draft.startDate = '2026-10-03';
    draft.endDate = '2026-10-07';

    expect(getDraftDateRangeLabel(draft)).toBe('Oct 3–7');
    expect(getDraftPeopleCountLabel(draft)).toBe('1 person');
    expect(getDraftMetadataLine(draft)).toBe('Oct 3–7 · 1 person');
  });

  it('shows Dates not added when dates are incomplete', () => {
    const draft = createEmptyTripDraft();
    draft.startDate = '2026-10-03';

    expect(getDraftDateRangeLabel(draft)).toBe(DRAFT_HOME_DATES_NOT_ADDED);
  });
});

describe('draft wizard metadata', () => {
  it('shows step progress for in-wizard drafts', () => {
    const stored = createStoredTripDraft();
    stored.wizardStep = 2;

    expect(getDraftWizardProgressLabel(stored)).toBe('Step 3 of 7');
  });

  it('shows review label when summary was reached', () => {
    const stored = createStoredTripDraft();
    stored.reachedSummary = true;
    stored.wizardStep = 6;

    expect(getDraftWizardProgressLabel(stored)).toBe('Review trip');
  });

  it('builds accessibility labels from destination and metadata', () => {
    const stored = createStoredTripDraft({
      destination: createDestinationFromText('Tokyo'),
    });
    stored.draft.startDate = '2026-09-12';
    stored.draft.endDate = '2026-09-18';

    expect(buildDraftCardAccessibilityLabel(stored)).toBe(
      'Continue planning Tokyo, Sep 12–18 · 1 person',
    );
    expect(buildDraftDeleteAccessibilityLabel(stored)).toBe('Delete Tokyo draft');
  });
});

describe('draft home ordering', () => {
  it('orders newer drafts before older with deterministic ties', () => {
    const older = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const newer = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    older.updatedAt = '2026-01-01T00:00:00.000Z';
    newer.updatedAt = '2026-01-02T00:00:00.000Z';

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), older), newer);
    const ordered = listInProgressDraftsOrdered(state);

    expect(ordered.map((entry) => entry.id)).toEqual([newer.id, older.id]);
  });

  it('breaks updatedAt ties deterministically by draft id', () => {
    const sharedUpdatedAt = '2026-09-01T12:00:00.000Z';
    const draftA = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    const draftB = createStoredTripDraft({ destination: createDestinationFromText('Paris') });
    draftA.updatedAt = sharedUpdatedAt;
    draftB.updatedAt = sharedUpdatedAt;

    let state = addStoredDraft(addStoredDraft(emptyTripDraftsState(), draftA), draftB);
    const ordered = listInProgressDraftsOrdered(state);

    expect(ordered.map((entry) => entry.id)).toEqual(
      [draftA.id, draftB.id].sort((left, right) => right.localeCompare(left)),
    );
  });
});

describe('draft resume route', () => {
  it('routes to summary when draft reached summary', () => {
    const stored = createStoredTripDraft();
    stored.reachedSummary = true;

    expect(resolveDraftResumeRoute(stored)).toBe('/trip/summary');
  });

  it('routes to create when draft is still in wizard', () => {
    const stored = createStoredTripDraft();

    expect(resolveDraftResumeRoute(stored)).toBe('/trip/create');
  });
});

describe('draft save and close route', () => {
  it('targets Trips home explicitly from Summary save and close', () => {
    expect(resolveDraftSaveAndCloseRoute()).toBe('/(tabs)');
  });
});
