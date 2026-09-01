import { normalizeInsight } from '@/domain/insight';
import type { TripEditFormState } from '@/features/trip-edit/utils/edit-trip-view-model';
import {
  availableSavedProfilesForTrip,
  buildAddTravellerConfirmBody,
  buildSharedDetailsPatch,
  buildTravellerAddedNotice,
  buildTravellerRemovedNotice,
  canRemoveTravellerFromTrip,
  createEditFormStateFromTrip,
  getEditTripPrimaryFooterLabel,
  getEditTripTravellerRows,
  hasStagedSharedChanges,
  isEditTripPrimaryFooterEnabled,
  isProfileAlreadyOnTrip,
  resolveEditTripPrimaryFooterAction,
  shouldDiscardStagedEdits,
  shouldExecuteRemoveTraveller,
  shouldProceedWithAddTraveller,
} from '@/features/trip-edit/utils/edit-trip-view-model';
import { updateTripSharedDetails } from '@/services/trip-edit-orchestration';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { createDestinationFromText } from '@/domain/destination';
import {
  appendTravellerPackingListToTrip,
  buildEmptyTravellerPackingListForTrip,
  detectTripPackingRelevantChanges,
} from '@/domain/trip-edit';

function createMeEmilieTrip(): Trip {
  const tripId = 'trip-ui-vm';
  const input: TripLike = {
    id: tripId,
    name: 'Family trip',
    title: 'Family trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: 'Original note',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    packingLists: [
      {
        id: primaryPackingListId(tripId),
        packingProfileId: `${tripId}-profile-self`,
        profileSnapshot: { id: `${tripId}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-1',
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
      {
        id: `${tripId}-list-emilie`,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'manual',
        items: [],
      },
    ],
    items: [],
    insights: ['Existing insight'],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

const jonasProfile = { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false as const };

function createTripWithJonas(): Trip {
  const trip = createMeEmilieTrip();
  const jonasList = buildEmptyTravellerPackingListForTrip(trip, jonasProfile, 'manual');
  return appendTravellerPackingListToTrip(trip, jonasList);
}

describe('edit trip view-model', () => {
  it('A. shows enabled Done when shared details are clean', () => {
    const trip = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(trip);

    expect(hasStagedSharedChanges(form, trip)).toBe(false);
    expect(getEditTripPrimaryFooterLabel(false)).toBe('Done');
    expect(isEditTripPrimaryFooterEnabled()).toBe(true);
    expect(resolveEditTripPrimaryFooterAction(false)).toBe('done');
  });

  it('B. shows Save changes when shared details are staged', () => {
    const trip = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(trip);
    form.draft.endDate = '2026-07-20';

    expect(hasStagedSharedChanges(form, trip)).toBe(true);
    expect(getEditTripPrimaryFooterLabel(true)).toBe('Save changes');
    expect(resolveEditTripPrimaryFooterAction(true)).toBe('save');
  });

  it('C. returns to clean Done after add-traveller-only structural change', () => {
    const before = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(before);
    const after = createTripWithJonas();

    expect(after.packingLists).toHaveLength(3);
    expect(hasStagedSharedChanges(form, after)).toBe(false);
    expect(getEditTripPrimaryFooterLabel(false)).toBe('Done');
    expect(buildTravellerAddedNotice('Jonas')).toBe('Jonas added');
  });

  it('D. returns to clean Done after remove-traveller-only structural change', () => {
    const trip = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(trip);
    const after = normalizeTrip({
      ...trip,
      packingLists: [trip.packingLists[0]],
    });

    expect(hasStagedSharedChanges(form, after)).toBe(false);
    expect(getEditTripPrimaryFooterLabel(false)).toBe('Done');
    expect(buildTravellerRemovedNotice('Emilie')).toBe('Emilie removed');
  });

  it('E. keeps Save changes when staged dates remain after add traveller', () => {
    const before = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(before);
    form.draft.endDate = '2026-07-20';
    const after = createTripWithJonas();

    expect(hasStagedSharedChanges(form, after)).toBe(true);
    expect(getEditTripPrimaryFooterLabel(true)).toBe('Save changes');
  });

  it('F. discard detection ignores already-persisted traveller mutations', () => {
    const before = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(before);
    const after = createTripWithJonas();

    expect(hasStagedSharedChanges(form, after)).toBe(false);
    expect(shouldDiscardStagedEdits(false, false)).toBe(true);

    form.draft.note = 'Changed after Jonas was added';
    expect(hasStagedSharedChanges(form, after)).toBe(true);
    expect(shouldDiscardStagedEdits(true, false)).toBe(false);
  });

  it('builds shared-details patch from staged form state', () => {
    const trip = createMeEmilieTrip();
    const form: TripEditFormState = {
      ...createEditFormStateFromTrip(trip),
      name: 'Renamed trip',
      draft: {
        ...createEditFormStateFromTrip(trip).draft,
        destination: createDestinationFromText('Bergen', 'Norway'),
        endDate: '2026-07-15',
        note: 'Updated note',
      },
    };

    const patch = buildSharedDetailsPatch(form, trip);

    expect(patch.name).toBe('Renamed trip');
    expect(patch.destination?.displayName).toBe('Bergen');
    expect(patch.endDate).toBe('2026-07-15');
    expect(patch.note).toBe('Updated note');
    expect(hasStagedSharedChanges(form, trip)).toBe(true);

    const { trip: updated } = updateTripSharedDetails(trip, patch);
    expect(updated.insights).toEqual([normalizeInsight('Existing insight')]);
    expect(updated.packingLists[0].items[0].packed).toBe(true);
    expect(updated.packingLists[1].items).toEqual([]);
  });

  it('B. treats cancel as safe when there are no staged changes', () => {
    const trip = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(trip);

    expect(hasStagedSharedChanges(form, trip)).toBe(false);
    expect(shouldDiscardStagedEdits(false, false)).toBe(true);
  });

  it('B. requires explicit discard confirmation when staged changes exist', () => {
    const trip = createMeEmilieTrip();
    const form = createEditFormStateFromTrip(trip);
    form.draft.note = 'Changed';

    expect(hasStagedSharedChanges(form, trip)).toBe(true);
    expect(shouldDiscardStagedEdits(true, false)).toBe(false);
    expect(shouldDiscardStagedEdits(true, true)).toBe(true);
  });

  it('F. hides remove action when only one packing list exists', () => {
    const trip = createMeEmilieTrip();
    const single = normalizeTrip({ ...trip, packingLists: [trip.packingLists[0]] });

    expect(canRemoveTravellerFromTrip(single)).toBe(false);
    expect(getEditTripTravellerRows(single)[0].canRemove).toBe(false);
  });

  it('E. does not execute remove before explicit confirmation', () => {
    expect(shouldExecuteRemoveTraveller('list-emilie', false)).toBe(false);
    expect(shouldExecuteRemoveTraveller(null, true)).toBe(false);
    expect(shouldExecuteRemoveTraveller('list-emilie', true)).toBe(true);
  });

  it('detects duplicate profile selection for add-traveller UI', () => {
    const trip = createMeEmilieTrip();

    expect(isProfileAlreadyOnTrip(trip, { id: 'profile-emilie', isSelf: false })).toBe(true);
    expect(isProfileAlreadyOnTrip(trip, { id: 'profile-jonas', isSelf: false })).toBe(false);
  });

  it('reports packing-relevant changes after staged save patch', () => {
    const trip = createMeEmilieTrip();
    const patch = buildSharedDetailsPatch(
      {
        ...createEditFormStateFromTrip(trip),
        draft: {
          ...createEditFormStateFromTrip(trip).draft,
          tripContext: ['Marathon'],
        },
      },
      trip,
    );

    const result = updateTripSharedDetails(trip, patch);
    expect(detectTripPackingRelevantChanges(trip, result.trip).tripContext).toBe(true);
    expect(result.packingRelevantChanges.tripContext).toBe(true);
  });

  it('C. requires explicit confirm before add-traveller proceeds', () => {
    const jonas = { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false as const };

    expect(shouldProceedWithAddTraveller(jonas, 'generated', false)).toBe(false);
    expect(shouldProceedWithAddTraveller(jonas, null, true)).toBe(false);
    expect(shouldProceedWithAddTraveller(null, 'manual', true)).toBe(false);
    expect(shouldProceedWithAddTraveller(jonas, 'generated', true)).toBe(true);
  });

  it('builds add-traveller reassurance copy for existing lists', () => {
    expect(buildAddTravellerConfirmBody('Jonas', ['Me', 'Emilie'])).toContain(
      "Me and Emilie's packing lists won't be changed.",
    );
  });

  it('filters saved profiles already on the trip', () => {
    const trip = createMeEmilieTrip();
    const available = availableSavedProfilesForTrip(
      [
        { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false },
      ],
      trip,
    );

    expect(available).toHaveLength(1);
    expect(available[0].name).toBe('Jonas');
  });
});
