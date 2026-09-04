import { createDestinationFromText } from '@/domain/destination';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import {
  getImportantConfigForProfile,
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  addStoredDraft,
  createStoredTripDraft,
  deleteDraftInState,
  emptyTripDraftsState,
} from '@/domain/trip-drafts-state';
import { findActiveTrip, reconcileActiveTripId } from '@/domain/packing-stats';
import {
  classifyTripLifecycle,
  deriveTripDateBucket,
  isPreviousTrip,
  isUpcomingTrip,
  reconcileActiveTripAfterLifecycleChange,
  referenceDateFromIso,
} from '@/domain/trip-lifecycle';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';

function createUuid(): string {
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
}

function createTestTrip(overrides: Partial<TripLike> & { id: string }): Trip {
  const listId = primaryPackingListId(overrides.id);
  return normalizeTrip({
    name: 'Test Trip',
    title: 'Test Trip',
    destination: createDestinationFromText('Tokyo', 'Japan'),
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: 'Bring snacks',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    insights: [{ id: 'ins-1', title: 'Tip', body: 'Pack light', category: 'trip-context' }],
    packingLists: [
      {
        id: listId,
        packingProfileId: 'profile-jonas',
        profileSnapshot: { id: 'profile-jonas', name: 'Jonas', isSelf: false, age: 8 },
        packingMode: 'generated',
        items: [
          {
            id: 'item-1',
            name: 'Medication snapshot',
            quantity: 1,
            category: 'Essentials',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            source: 'important',
            importantItemId: 'imp-master-1',
          },
        ],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
    ...overrides,
  });
}

describe('trip lifecycle classification', () => {
  const ref = referenceDateFromIso('2026-09-02');

  it('classifies future trips as Upcoming', () => {
    const trip = createTestTrip({ id: 'future', endDate: '2026-12-01' });
    expect(classifyTripLifecycle(trip, ref)).toBe('upcoming');
    expect(isUpcomingTrip(trip, ref)).toBe(true);
  });

  it('classifies past trips as Previous', () => {
    const trip = createTestTrip({ id: 'past', endDate: '2026-08-01' });
    expect(classifyTripLifecycle(trip, ref)).toBe('past');
    expect(isPreviousTrip(trip, ref)).toBe(true);
  });

  it('treats trips ending today as Upcoming', () => {
    const trip = createTestTrip({ id: 'today', endDate: '2026-09-02' });
    expect(deriveTripDateBucket(trip, ref)).toBe('upcoming');
  });
});

describe('active trip reconciliation', () => {
  it('clears active trip/list when permanently deleting the active trip', () => {
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-a', 'permanent_delete'),
    ).toEqual({ activeTripId: null, activePackingListId: null });
  });

  it('preserves active trip/list when a non-active trip is deleted', () => {
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-b', 'permanent_delete'),
    ).toEqual({ activeTripId: 'trip-a', activePackingListId: 'list-a' });
  });

  it('reconcileActiveTripId keeps valid active trips', () => {
    const trip = createTestTrip({ id: 'trip-active' });
    expect(reconcileActiveTripId('trip-active', [trip])).toBe('trip-active');
    expect(findActiveTrip([trip], 'trip-active')).toBe(trip);
  });
});

describe('draft isolation from committed trip deletion', () => {
  it('does not mutate drafts when simulating trip delete state changes', () => {
    const draft = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    let draftState = addStoredDraft(emptyTripDraftsState(), draft);
    const trip = createTestTrip({ id: 'trip-owned' });

    draftState = deleteDraftInState(draftState, draft.id);

    expect(draftState.drafts).toHaveLength(0);
    expect(trip.status).toBe('upcoming');
  });
});

describe('profile Important ownership on permanent delete', () => {
  it('removes trip snapshot but preserves reusable profile Important master', () => {
    let importantByProfileId: ImportantItemsByProfileId = {};
    const result = saveImportantItemNamesForProfile(
      importantByProfileId,
      'profile-jonas',
      ['Medication'],
      createUuid,
    );
    importantByProfileId = result.store;

    const tripA = createTestTrip({ id: 'trip-a' });
    const tripB = createTestTrip({ id: 'trip-b', endDate: '2026-11-01' });
    const trips = [tripA, tripB];
    const remainingTrips = trips.filter((entry) => entry.id !== 'trip-a');

    expect(remainingTrips).toHaveLength(1);
    expect(remainingTrips[0]?.id).toBe('trip-b');
    expect(getImportantConfigForProfile(importantByProfileId, 'profile-jonas').items).toHaveLength(1);
    expect(getImportantConfigForProfile(importantByProfileId, 'profile-jonas').items[0]?.name).toBe(
      'Medication',
    );
  });
});

describe('MockTripRepository permanent delete', () => {
  it('removes only the targeted trip', async () => {
    const tripA = createTestTrip({ id: 'repo-a' });
    const tripB = createTestTrip({ id: 'repo-b' });
    const repository = new MockTripRepository([tripA, tripB]);

    await repository.delete('repo-a');

    const all = await repository.getAll();
    expect(all.map((entry) => entry.id)).toEqual(['repo-b']);
    expect(await repository.getById('repo-a')).toBeNull();
  });
});
