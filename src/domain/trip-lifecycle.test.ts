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
import {
  listArchivedTrips,
  listPreviousTripsForHome,
  listUpcomingTripsForHome,
} from '@/domain/trip-home-selectors';
import { findActiveTrip, reconcileActiveTripId } from '@/domain/packing-stats';
import {
  archiveTrip,
  classifyTripLifecycle,
  deriveTripDateBucket,
  isPreviousTrip,
  isUpcomingTrip,
  reconcileActiveTripAfterLifecycleChange,
  referenceDateFromIso,
  restoreArchivedTrip,
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

  it('excludes archived trips from Upcoming and Previous', () => {
    const futureArchived = archiveTrip(createTestTrip({ id: 'arch-future', endDate: '2026-12-01' }));
    const pastArchived = archiveTrip(createTestTrip({ id: 'arch-past', endDate: '2026-01-01' }));

    expect(classifyTripLifecycle(futureArchived, ref)).toBe('archived');
    expect(classifyTripLifecycle(pastArchived, ref)).toBe('archived');
    expect(listUpcomingTripsForHome([futureArchived, pastArchived], ref)).toEqual([]);
    expect(listPreviousTripsForHome([futureArchived, pastArchived], ref)).toEqual([]);
    expect(listArchivedTrips([futureArchived, pastArchived])).toHaveLength(2);
  });

  it('restores future trips to Upcoming and past trips to Previous', () => {
    const future = restoreArchivedTrip(
      archiveTrip(createTestTrip({ id: 'future-restore', endDate: '2026-12-01' })),
      ref,
    );
    const past = restoreArchivedTrip(
      archiveTrip(createTestTrip({ id: 'past-restore', endDate: '2026-01-01' })),
      ref,
    );

    expect(future.status).toBe('upcoming');
    expect(past.status).toBe('past');
    expect(isUpcomingTrip(future, ref)).toBe(true);
    expect(isPreviousTrip(past, ref)).toBe(true);
  });
});

describe('archiveTrip', () => {
  it('archives only lifecycle metadata and preserves nested trip content', () => {
    const original = createTestTrip({ id: 'trip-a' });
    const archived = archiveTrip(original);

    expect(archived.status).toBe('archived');
    expect(archived.packingLists).toEqual(original.packingLists);
    expect(archived.insights).toEqual(original.insights);
    expect(archived.weather).toEqual(original.weather);
    expect(archived.note).toBe('Bring snacks');
  });

  it('is idempotent when archiving an already archived trip', () => {
    const trip = archiveTrip(createTestTrip({ id: 'trip-b' }));
    expect(archiveTrip(trip)).toBe(trip);
  });
});

describe('restoreArchivedTrip', () => {
  it('is idempotent when restoring a non-archived trip', () => {
    const trip = createTestTrip({ id: 'trip-c', status: 'upcoming' });
    expect(restoreArchivedTrip(trip)).toBe(trip);
  });
});

describe('active trip reconciliation', () => {
  it('clears active trip/list when archiving or deleting the active trip', () => {
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-a', 'archive'),
    ).toEqual({ activeTripId: null, activePackingListId: null });
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-a', 'permanent_delete'),
    ).toEqual({ activeTripId: null, activePackingListId: null });
  });

  it('preserves active trip/list when a non-active trip is archived or deleted', () => {
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-b', 'archive'),
    ).toEqual({ activeTripId: 'trip-a', activePackingListId: 'list-a' });
  });

  it('does not auto-select a restored trip as active', () => {
    expect(
      reconcileActiveTripAfterLifecycleChange('trip-a', 'list-a', 'trip-b', 'restore'),
    ).toEqual({ activeTripId: 'trip-a', activePackingListId: 'list-a' });
  });

  it('reconcileActiveTripId ignores archived trips', () => {
    const archived = archiveTrip(createTestTrip({ id: 'trip-archived' }));
    expect(reconcileActiveTripId('trip-archived', [archived])).toBeNull();
    expect(findActiveTrip([archived], 'trip-archived')).toBeNull();
  });
});

describe('draft isolation from committed trip lifecycle', () => {
  it('does not mutate drafts when simulating trip archive/delete state changes', () => {
    const draft = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
    let draftState = addStoredDraft(emptyTripDraftsState(), draft);
    const trip = createTestTrip({ id: 'trip-owned' });

    archiveTrip(trip);
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
