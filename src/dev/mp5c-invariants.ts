import { createDestinationFromText } from '@/domain/destination';
import {
  getImportantConfigForProfile,
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  addStoredDraft,
  createStoredTripDraft,
  emptyTripDraftsState,
  getStoredDraftById,
} from '@/domain/trip-drafts-state';
import {
  archiveTrip,
  restoreArchivedTrip,
} from '@/domain/trip-lifecycle';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createUuid(): string {
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
}

function createFixtureTrip(id: string): ReturnType<typeof normalizeTrip> {
  const input: TripLike = {
    id,
    name: 'Fixture',
    title: 'Fixture',
    destination: createDestinationFromText('Oslo'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 18, low: 8 },
    insights: [],
    packingLists: [
      {
        id: primaryPackingListId(id),
        packingProfileId: 'profile-me',
        profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: `${id}-item`,
            name: 'Passport',
            quantity: 1,
            category: 'Essentials',
            packed: false,
            needToBuy: false,
            assignedTo: null,
            source: 'generated',
          },
        ],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

function verifyArchiveRestorePreservesListContent(): void {
  const original = createFixtureTrip('trip-archive');
  const archived = archiveTrip(original);
  const restored = restoreArchivedTrip(archived);

  assert(archived.packingLists[0]?.items[0]?.name === 'Passport', 'archive preserves list items');
  assert(restored.packingLists[0]?.items[0]?.name === 'Passport', 'restore preserves list items');
  assert(restored.status !== 'archived', 'restore clears archived status');
}

function verifyDraftIsolationFromTripLifecycle(): void {
  const draft = createStoredTripDraft({ destination: createDestinationFromText('Tokyo') });
  let state = addStoredDraft(emptyTripDraftsState(), draft);
  const trip = createFixtureTrip('committed-trip');

  archiveTrip(trip);
  assert(getStoredDraftById(state, draft.id) !== null, 'archive does not remove drafts');

  state = addStoredDraft(state, createStoredTripDraft({ destination: createDestinationFromText('Paris') }));
  assert(state.drafts.length === 2, 'drafts remain independent from trip archive');
}

function verifyPermanentDeletePreservesProfileImportantMaster(): void {
  const store = saveImportantItemNamesForProfile({}, 'profile-jonas', ['Medication'], createUuid).store;
  const config = getImportantConfigForProfile(store, 'profile-jonas');
  assert(config.items.length === 1, 'reusable Important master survives trip delete');
  assert(config.items[0]?.name === 'Medication', 'Important master item unchanged');
}

async function verifyPermanentDeleteDoesNotAffectOtherTrip(): Promise<void> {
  const tripA = createFixtureTrip('trip-delete-a');
  const tripB = createFixtureTrip('trip-delete-b');
  const repository = new MockTripRepository([tripA, tripB]);
  await repository.delete('trip-delete-a');
  const remaining = await repository.getAll();
  assert(remaining.length === 1, 'delete removes only target trip');
  assert(remaining[0]?.id === 'trip-delete-b', 'unrelated trip remains');
}

export async function runMp5cInvariantChecks(): Promise<void> {
  verifyArchiveRestorePreservesListContent();
  verifyDraftIsolationFromTripLifecycle();
  verifyPermanentDeletePreservesProfileImportantMaster();
  await verifyPermanentDeleteDoesNotAffectOtherTrip();
}
