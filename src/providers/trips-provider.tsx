import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';

import { resolveTripPackEntry } from '@/domain/trip-pack-entry';
import { findActiveTrip, reconcileActiveTripId } from '@/domain/packing-stats';
import {
  archiveTrip as archiveTripInState,
  reconcileActiveTripAfterLifecycleChange,
  restoreArchivedTrip as restoreArchivedTripInState,
} from '@/domain/trip-lifecycle';
import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { ImportantItem } from '@/domain/important-item';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import {
  collectDraftOnlyProfileIds,
  mergeImportantStores,
} from '@/domain/draft-important-scope';
import {
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import {
  addStoredDraft,
  createStoredTripDraft,
  deleteDraftInState,
  dismissDraftImportantPrompt,
  emptyTripDraftsState,
  listInProgressDraftsOrdered,
  getActiveStoredDraft,
  getStoredDraftById,
  removeCommittedDraft,
  resumeDraftInState,
  type StoredTripDraft,
  type TripDraftsState,
  resolveActiveDraftIdForMutation,
  resolveCommitDraftTargetId,
  updateStoredDraftMeta,
  updateStoredDraftTrip,
} from '@/domain/trip-drafts-state';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import type {
  RemoveTravellerFromTripInput,
  TripPackingRelevantChanges,
  TripSharedDetailsUserEdit,
} from '@/domain/trip-edit';
import type { PackingMode, Trip } from '@/domain/trip';
import {
  appendPackingListItem,
  findPackingItemInList,
  findPackingListById,
  getPackingListItems,
  patchPackingListItem,
  removePackingListItem,
  replacePackingListItems,
} from '@/domain/trip-compatibility';
import { createPackingItemId, createUuid } from '@/lib/id';
import {
  buildPackingItemSettingsPatch,
  canSavePackingItemSettings,
  type PackingItemSettingsInput,
} from '@/domain/packing-item-settings';
import { useAuth } from '@/providers/auth-provider';
import { useProfile } from '@/providers/profile-provider';
import { useServices } from '@/providers/services-provider';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import {
  addTravellerToTrip as orchestrateAddTravellerToTrip,
  reconcileActiveListAfterTravellerRemoval,
  removeTravellerFromTrip as orchestrateRemoveTravellerFromTrip,
  updateTripSharedDetails as orchestrateTripSharedDetailsUpdate,
} from '@/services/trip-edit-orchestration';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import { syncTripImportantSnapshot } from '@/services/packing/sync-important-snapshot';

function applyDraftsStateUpdate(
  ref: MutableRefObject<TripDraftsState>,
  updater: (current: TripDraftsState) => TripDraftsState,
): (current: TripDraftsState) => TripDraftsState {
  return (current) => {
    const next = updater(current);
    ref.current = next;
    return next;
  };
}

export type AppTab = 'trips' | 'pack' | 'profile';

interface TripsContextValue {
  trips: Trip[];
  activeTripId: string | null;
  activeTrip: Trip | null;
  activePackingListId: string | null;
  activePackingList: PackingList | null;
  /** All unfinished trip drafts in session (MP5B). */
  drafts: StoredTripDraft[];
  activeDraftId: string | null;
  /** Active creation draft — derived from activeDraftId; empty shell when none active. */
  draft: TripDraft;
  draftWizardStep: number;
  draftReachedSummary: boolean;
  isLoading: boolean;
  repositoryError: string | null;
  setActiveTripId: (tripId: string | null) => void;
  setActivePackingListId: (packingListId: string | null) => void;
  /** Set active trip + packing list for Pack entry (no MP3A primary fallback). */
  beginTripPackEntry: (tripId: string, explicitListId?: string) => 'pack' | 'select-list';
  /** Explicit list selection within the active trip — does not change activeTripId. */
  selectActivePackingList: (packingListId: string) => void;
  getDraftById: (draftId: string) => StoredTripDraft | null;
  /** In-progress drafts ordered by most recently touched (Home list). */
  inProgressDraftsOrdered: StoredTripDraft[];
  /** @deprecated Prefer inProgressDraftsOrdered — reads live React state, not a ref snapshot. */
  listInProgressDraftsOrdered: () => StoredTripDraft[];
  /** Most recently touched in-progress draft for temporary single-CTA Home compatibility. */
  getPrimaryInProgressDraft: () => StoredTripDraft | null;
  createNewDraft: () => string;
  resumeDraft: (draftId: string) => boolean;
  deleteDraft: (draftId: string) => boolean;
  setDraft: (patch: Partial<TripDraft>) => void;
  setDraftWizardStep: (step: number) => void;
  markDraftReachedSummary: () => void;
  /** @deprecated Use createNewDraft — creates a new draft without removing existing drafts. */
  resetDraft: () => void;
  saveDraftImportantItemsForProfile: (profileId: string, names: string[]) => ImportantItem[];
  dismissDraftImportantPromptForProfile: (profileId: string) => void;
  getActiveDraftImportantByProfileId: () => Record<string, ImportantItemsConfig>;
  /** True while commitDraftTrip succeeded and post-create navigation is pending. */
  isCommitDraftInFlight: boolean;
  /** Clears commit-in-flight guard after navigating away from Summary/Generating. */
  acknowledgeCommitDraftNavigation: () => void;
  refreshTrips: () => Promise<void>;
  commitDraftTrip: (packingMode?: PackingMode, draftId?: string) => Promise<Trip>;
  archiveTrip: (tripId: string) => Promise<Trip>;
  restoreTrip: (tripId: string) => Promise<Trip>;
  deleteTripPermanently: (tripId: string) => Promise<void>;
  updateTripSharedDetails: (
    tripId: string,
    patch: TripSharedDetailsUserEdit,
  ) => Promise<{ trip: Trip; packingRelevantChanges: TripPackingRelevantChanges }>;
  addTravellerToTrip: (
    tripId: string,
    profile: PackingProfile,
    packingMode: PackingMode,
  ) => Promise<Trip>;
  removeTravellerFromTrip: (
    tripId: string,
    input: RemoveTravellerFromTripInput,
  ) => Promise<Trip>;
  togglePacked: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  renamePackingItem: (itemId: string, name: string) => void;
  setPackingItemNote: (itemId: string, note: string) => void;
  updatePackingItemSettings: (itemId: string, settings: PackingItemSettingsInput) => boolean;
  toggleNeedToBuy: (itemId: string) => void;
  markItemPurchased: (itemId: string) => void;
  assignItem: (itemId: string, travelerId: string | null) => void;
  deletePackingItem: (itemId: string) => void;
  addPackingItem: (input: {
    name: string;
    category: PackingCategory;
    quantity?: number;
    needToBuy?: boolean;
    assignedTo?: string | null;
  }) => void;
  injectImportantItemsIntoList: (
    tripId: string,
    listId: string,
    importantItems: ImportantItem[],
  ) => void;
  syncImportantSnapshotForList: (
    tripId: string,
    listId: string,
    importantItems: ImportantItem[],
  ) => void;
  /** @deprecated Use injectImportantItemsIntoList with explicit list id. */
  injectImportantItemsIntoTrip: (tripId: string, importantItems: ImportantItem[]) => void;
  /** @deprecated Use syncImportantSnapshotForList with explicit list id. */
  syncImportantSnapshotForTrip: (tripId: string, importantItems: ImportantItem[]) => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

function mapTripById(trips: Trip[], tripId: string, updater: (trip: Trip) => Trip): Trip[] {
  return trips.map((entry) => (entry.id === tripId ? updater(entry) : entry));
}

function resolvePackingListSelection(
  tripId: string | null,
  previousTripId: string | null,
  previousListId: string | null,
  trips: Trip[],
  explicitListId?: string,
): string | null {
  if (!tripId) {
    return null;
  }

  return resolveTripPackEntry(tripId, previousTripId, previousListId, trips, explicitListId)
    .activePackingListId;
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const { isAuthReady, authError } = useAuth();
  const { importantByProfileId, rememberPackingProfile, purgeImportantProfileIds, savedPackingProfiles } = useProfile();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [activePackingListId, setActivePackingListIdState] = useState<string | null>(null);
  const [draftsState, setDraftsState] = useState<TripDraftsState>(emptyTripDraftsState);
  const [isCommitDraftInFlight, setIsCommitDraftInFlight] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const tripsRef = useRef(trips);
  const activeTripIdRef = useRef(activeTripId);
  const activePackingListIdRef = useRef(activePackingListId);
  const commitDraftInFlightRef = useRef<Promise<Trip> | null>(null);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  useEffect(() => {
    activeTripIdRef.current = activeTripId;
  }, [activeTripId]);

  useEffect(() => {
    activePackingListIdRef.current = activePackingListId;
  }, [activePackingListId]);

  const setActiveTripId = useCallback((tripId: string | null) => {
    const previousTripId = activeTripIdRef.current;
    setActiveTripIdState(tripId);
    setActivePackingListIdState(
      resolvePackingListSelection(
        tripId,
        previousTripId,
        activePackingListIdRef.current,
        tripsRef.current,
      ),
    );
  }, []);

  const setActivePackingListId = useCallback(
    (packingListId: string | null) => {
      if (!activeTripIdRef.current) {
        setActivePackingListIdState(null);
        return;
      }

      if (packingListId === null) {
        setActivePackingListIdState(null);
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === activeTripIdRef.current);
      if (!trip?.packingLists.some((list) => list.id === packingListId)) {
        return;
      }

      setActivePackingListIdState(packingListId);
    },
    [],
  );

  const selectActivePackingList = useCallback((packingListId: string) => {
    if (!activeTripIdRef.current) {
      return;
    }

    const trip = tripsRef.current.find((entry) => entry.id === activeTripIdRef.current);
    if (!trip?.packingLists.some((list) => list.id === packingListId)) {
      return;
    }

    setActivePackingListIdState(packingListId);
  }, []);

  const beginTripPackEntry = useCallback(
    (tripId: string, explicitListId?: string): 'pack' | 'select-list' => {
      const previousTripId = activeTripIdRef.current;
      const entry = resolveTripPackEntry(
        tripId,
        previousTripId,
        activePackingListIdRef.current,
        tripsRef.current,
        explicitListId,
      );

      setActiveTripIdState(tripId);
      setActivePackingListIdState(entry.activePackingListId);
      return entry.destination;
    },
    [],
  );

  const isLoading = !isAuthReady || isTripsLoading;

  const refreshTrips = useCallback(async () => {
    const loaded = await tripRepository.getAll();
    setTrips(loaded);
    setActiveTripIdState((currentTripId) => {
      const nextTripId = reconcileActiveTripId(currentTripId, loaded);
      setActivePackingListIdState(
        resolvePackingListSelection(
          nextTripId,
          currentTripId,
          activePackingListIdRef.current,
          loaded,
        ),
      );
      return nextTripId;
    });
  }, [tripRepository]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setRepositoryError(authError);
        const loaded = await tripRepository.getAll();
        if (!mounted) {
          return;
        }

        setTrips(loaded);
        setActiveTripIdState((currentTripId) => {
          const nextTripId = reconcileActiveTripId(currentTripId, loaded);
          setActivePackingListIdState(
            resolvePackingListSelection(
              nextTripId,
              currentTripId,
              activePackingListIdRef.current,
              loaded,
            ),
          );
          return nextTripId;
        });
      } catch (error) {
        if (mounted) {
          setRepositoryError(error instanceof Error ? error.message : 'Failed to load trips');
        }
      } finally {
        if (mounted) {
          setIsTripsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthReady, authError, tripRepository]);

  const draftsStateRef = useRef(draftsState);
  const savedProfileIdsRef = useRef(new Set(savedPackingProfiles.map((profile) => profile.id)));

  useEffect(() => {
    draftsStateRef.current = draftsState;
  }, [draftsState]);

  useEffect(() => {
    savedProfileIdsRef.current = new Set(savedPackingProfiles.map((profile) => profile.id));
  }, [savedPackingProfiles]);

  const activeStoredDraft = useMemo(
    () => getActiveStoredDraft(draftsState),
    [draftsState],
  );

  const inProgressDraftsOrdered = useMemo(
    () => listInProgressDraftsOrdered(draftsState),
    [draftsState],
  );

  const draft = activeStoredDraft?.draft ?? createEmptyTripDraft();
  const draftWizardStep = activeStoredDraft?.wizardStep ?? 0;
  const draftReachedSummary = activeStoredDraft?.reachedSummary ?? false;

  const getDraftById = useCallback(
    (draftId: string) => getStoredDraftById(draftsStateRef.current, draftId),
    [],
  );

  const getPrimaryInProgressDraft = useCallback(
    () => inProgressDraftsOrdered[0] ?? null,
    [inProgressDraftsOrdered],
  );

  const listInProgressDraftsOrderedCallback = useCallback(
    () => inProgressDraftsOrdered,
    [inProgressDraftsOrdered],
  );

  const createNewDraft = useCallback(() => {
    const stored = createStoredTripDraft();
    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => addStoredDraft(current, stored)),
    );
    return stored.id;
  }, []);

  const resumeDraft = useCallback((draftId: string) => {
    let resumed = false;

    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => {
        const next = resumeDraftInState(current, draftId);
        if (!next) {
          return current;
        }

        resumed = true;
        return next;
      }),
    );

    return resumed;
  }, []);

  const deleteDraft = useCallback(
    (draftId: string) => {
      const stored = getStoredDraftById(draftsStateRef.current, draftId);
      if (!stored) {
        return false;
      }

      const draftOnlyProfileIds = collectDraftOnlyProfileIds(
        stored.draft.packingProfiles,
        savedProfileIdsRef.current,
      );

      setDraftsState(
        applyDraftsStateUpdate(draftsStateRef, (current) => deleteDraftInState(current, draftId)),
      );
      purgeImportantProfileIds(draftOnlyProfileIds);

      return true;
    },
    [purgeImportantProfileIds],
  );

  const setDraft = useCallback((patch: Partial<TripDraft>) => {
    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => {
        const draftId = resolveActiveDraftIdForMutation(current);
        if (!draftId) {
          return current;
        }

        return updateStoredDraftTrip(current, draftId, patch);
      }),
    );
  }, []);

  const setDraftWizardStep = useCallback((step: number) => {
    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => {
        const draftId = resolveActiveDraftIdForMutation(current);
        if (!draftId) {
          return current;
        }

        return updateStoredDraftMeta(current, draftId, { wizardStep: step });
      }),
    );
  }, []);

  const resetDraft = useCallback(() => {
    createNewDraft();
  }, [createNewDraft]);

  const markDraftReachedSummary = useCallback(() => {
    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => {
        const draftId = resolveActiveDraftIdForMutation(current);
        if (!draftId) {
          return current;
        }

        return updateStoredDraftMeta(current, draftId, { reachedSummary: true });
      }),
    );
  }, []);

  const saveDraftImportantItemsForProfile = useCallback(
    (profileId: string, names: string[]): ImportantItem[] => {
      let savedItems: ImportantItem[] = [];

      setDraftsState(
        applyDraftsStateUpdate(draftsStateRef, (current) => {
          const draftId = resolveActiveDraftIdForMutation(current);
          if (!draftId) {
            return current;
          }

          const stored = getStoredDraftById(current, draftId);
          if (!stored) {
            return current;
          }

          const result = saveImportantItemNamesForProfile(
            stored.draftImportantByProfileId,
            profileId,
            names,
            createUuid,
          );
          savedItems = result.savedItems;

          return updateStoredDraftMeta(current, draftId, {
            draftImportantByProfileId: result.store,
          });
        }),
      );

      return savedItems;
    },
    [],
  );

  const dismissDraftImportantPromptForProfile = useCallback((profileId: string) => {
    setDraftsState(
      applyDraftsStateUpdate(draftsStateRef, (current) => {
        const draftId = resolveActiveDraftIdForMutation(current);
        if (!draftId) {
          return current;
        }

        return dismissDraftImportantPrompt(current, draftId, profileId);
      }),
    );
  }, []);

  const getActiveDraftImportantByProfileId = useCallback(() => {
    const stored = getActiveStoredDraft(draftsStateRef.current);
    return stored?.draftImportantByProfileId ?? {};
  }, []);

  const acknowledgeCommitDraftNavigation = useCallback(() => {
    setIsCommitDraftInFlight(false);
  }, []);

  const commitDraftTrip = useCallback(
    async (packingMode: PackingMode = 'generated', explicitDraftId?: string) => {
      if (commitDraftInFlightRef.current) {
        return commitDraftInFlightRef.current;
      }

      setIsCommitDraftInFlight(true);

      const promise = (async () => {
        const stateSnapshot = draftsStateRef.current;
        const targetDraftId = resolveCommitDraftTargetId(stateSnapshot, explicitDraftId);
        if (!targetDraftId) {
          throw new Error(
            explicitDraftId
              ? `Trip draft not found: ${explicitDraftId}`
              : 'No trip draft to commit',
          );
        }

        const stored = getStoredDraftById(stateSnapshot, targetDraftId)!;

        const draftSnapshot = stored.draft;
        const mergedImportant = mergeImportantStores(
          importantByProfileId,
          stored.draftImportantByProfileId,
        );

        const assembled = await assembleTripFromDraft(
          draftSnapshot,
          {
            packingGenerator,
            weatherService,
          },
          { packingMode, importantByProfileId: mergedImportant },
        );
        const saved = await tripRepository.createTrip(assembled);

        for (const profile of draftSnapshot.packingProfiles) {
          if (!profile.isSelf && profile.rememberForFutureTrips) {
            rememberPackingProfile(profile, stored.draftImportantByProfileId[profile.id]);
          }
        }

        setTrips((current) => {
          const withoutDuplicate = current.filter((trip) => trip.id !== saved.id);
          return [saved, ...withoutDuplicate];
        });
        setActiveTripIdState(saved.id);
        setActivePackingListIdState(
          resolvePackingListSelection(saved.id, null, null, [saved, ...tripsRef.current.filter((t) => t.id !== saved.id)]),
        );
        setDraftsState(
          applyDraftsStateUpdate(draftsStateRef, (current) =>
            removeCommittedDraft(current, targetDraftId),
          ),
        );
        setRepositoryError(null);
        return saved;
      })().catch((error) => {
        setIsCommitDraftInFlight(false);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to create trip');
        throw error;
      });

      commitDraftInFlightRef.current = promise;

      try {
        return await promise;
      } finally {
        commitDraftInFlightRef.current = null;
      }
    },
    [
      importantByProfileId,
      packingGenerator,
      rememberPackingProfile,
      weatherService,
      tripRepository,
    ],
  );

  const archiveTrip = useCallback(
    async (tripId: string) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const previousTrips = tripsRef.current;
      const previousActiveTripId = activeTripIdRef.current;
      const previousActiveListId = activePackingListIdRef.current;
      const archived = archiveTripInState(trip);

      setTrips(mapTripById(previousTrips, tripId, () => archived));
      const reconciled = reconcileActiveTripAfterLifecycleChange(
        previousActiveTripId,
        previousActiveListId,
        tripId,
        'archive',
      );
      setActiveTripIdState(reconciled.activeTripId);
      setActivePackingListIdState(reconciled.activePackingListId);

      try {
        const saved = await tripRepository.save(archived);
        setTrips(mapTripById(tripsRef.current, tripId, () => saved));
        setRepositoryError(null);
        return saved;
      } catch (error) {
        setTrips(previousTrips);
        setActiveTripIdState(previousActiveTripId);
        setActivePackingListIdState(previousActiveListId);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to archive trip');
        throw error;
      }
    },
    [tripRepository],
  );

  const restoreTrip = useCallback(
    async (tripId: string) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const previousTrips = tripsRef.current;
      const restored = restoreArchivedTripInState(trip);

      setTrips(mapTripById(previousTrips, tripId, () => restored));

      try {
        const saved = await tripRepository.save(restored);
        setTrips(mapTripById(tripsRef.current, tripId, () => saved));
        setRepositoryError(null);
        return saved;
      } catch (error) {
        setTrips(previousTrips);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to restore trip');
        throw error;
      }
    },
    [tripRepository],
  );

  const deleteTripPermanently = useCallback(
    async (tripId: string) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const previousTrips = tripsRef.current;
      const previousActiveTripId = activeTripIdRef.current;
      const previousActiveListId = activePackingListIdRef.current;

      setTrips(previousTrips.filter((entry) => entry.id !== tripId));
      const reconciled = reconcileActiveTripAfterLifecycleChange(
        previousActiveTripId,
        previousActiveListId,
        tripId,
        'permanent_delete',
      );
      setActiveTripIdState(reconciled.activeTripId);
      setActivePackingListIdState(reconciled.activePackingListId);

      try {
        await tripRepository.delete(tripId);
        setRepositoryError(null);
      } catch (error) {
        setTrips(previousTrips);
        setActiveTripIdState(previousActiveTripId);
        setActivePackingListIdState(previousActiveListId);
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to delete trip permanently',
        );
        throw error;
      }
    },
    [tripRepository],
  );

  const updateTripSharedDetails = useCallback(
    async (tripId: string, patch: TripSharedDetailsUserEdit) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const previousTrips = tripsRef.current;
      const { trip: updatedTrip, packingRelevantChanges } = orchestrateTripSharedDetailsUpdate(
        trip,
        patch,
      );

      setTrips(mapTripById(previousTrips, tripId, () => updatedTrip));

      try {
        const saved = await tripRepository.save(updatedTrip);
        setTrips(mapTripById(tripsRef.current, tripId, () => saved));
        setRepositoryError(null);
        return { trip: saved, packingRelevantChanges };
      } catch (error) {
        setTrips(previousTrips);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to update trip');
        throw error;
      }
    },
    [tripRepository],
  );

  const addTravellerToTrip = useCallback(
    async (tripId: string, profile: PackingProfile, packingMode: PackingMode) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const previousTrips = tripsRef.current;
      const result = await orchestrateAddTravellerToTrip(
        { trip, profile, packingMode, importantByProfileId },
        { packingGenerator },
      );

      setTrips(mapTripById(previousTrips, tripId, () => result.trip));

      try {
        const saved = await tripRepository.save(result.trip);
        setTrips(mapTripById(tripsRef.current, tripId, () => saved));
        setRepositoryError(null);
        return saved;
      } catch (error) {
        setTrips(previousTrips);
        setRepositoryError(error instanceof Error ? error.message : 'Failed to add traveller');
        throw error;
      }
    },
    [importantByProfileId, packingGenerator, tripRepository],
  );

  const removeTravellerFromTrip = useCallback(
    async (tripId: string, input: RemoveTravellerFromTripInput) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const removedListId =
        input.packingListId ??
        trip.packingLists.find(
          (list) =>
            list.packingProfileId === input.packingProfileId ||
            list.profileSnapshot.id === input.packingProfileId,
        )?.id;

      const previousTrips = tripsRef.current;
      const previousActiveListId = activePackingListIdRef.current;
      const updatedTrip = orchestrateRemoveTravellerFromTrip(trip, input);

      setTrips(mapTripById(previousTrips, tripId, () => updatedTrip));
      if (activeTripIdRef.current === tripId && removedListId) {
        setActivePackingListIdState(
          reconcileActiveListAfterTravellerRemoval(
            tripId,
            previousActiveListId,
            removedListId,
            updatedTrip,
          ),
        );
      }

      try {
        const saved = await tripRepository.save(updatedTrip);
        setTrips(mapTripById(tripsRef.current, tripId, () => saved));
        setRepositoryError(null);
        return saved;
      } catch (error) {
        setTrips(previousTrips);
        if (activeTripIdRef.current === tripId) {
          setActivePackingListIdState(previousActiveListId);
        }
        setRepositoryError(error instanceof Error ? error.message : 'Failed to remove traveller');
        throw error;
      }
    },
    [tripRepository],
  );

  const togglePacked = useCallback(
    (itemId: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item) {
        return;
      }

      const previousPacked = item.packed;
      const nextPacked = !previousPacked;
      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { packed: nextPacked }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { packed: nextPacked }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { packed: previousPacked }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [tripRepository],
  );

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item) {
        return;
      }

      const previousQuantity = item.quantity;
      const nextQuantity = Math.max(1, quantity);

      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { quantity: nextQuantity }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { quantity: nextQuantity }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { quantity: previousQuantity }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update quantity');
        });
    },
    [tripRepository],
  );

  const renamePackingItem = useCallback(
    (itemId: string, name: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item || isImportantPackingItem(item)) {
        return;
      }

      if (item.name === trimmed) {
        return;
      }

      const previousName = item.name;

      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { name: trimmed }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { name: trimmed }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { name: previousName }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to rename item');
        });
    },
    [tripRepository],
  );

  const setPackingItemNote = useCallback(
    (itemId: string, note: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item || isImportantPackingItem(item)) {
        return;
      }

      const trimmed = note.trim();
      const nextNote = trimmed.length > 0 ? trimmed : undefined;
      const previousNote = item.note;

      if (previousNote === nextNote) {
        return;
      }

      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { note: nextNote }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { note: nextNote ?? '' }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { note: previousNote }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update note');
        });
    },
    [tripRepository],
  );

  const updatePackingItemSettings = useCallback(
    (itemId: string, settings: PackingItemSettingsInput): boolean => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return false;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item) {
        return false;
      }

      if (!canSavePackingItemSettings(item, settings)) {
        return false;
      }

      const patch = buildPackingItemSettingsPatch(item, settings);
      if (Object.keys(patch).length === 0) {
        return false;
      }

      const previous = {
        name: item.name,
        quantity: item.quantity,
        needToBuy: item.needToBuy,
        assignedTo: item.assignedTo,
        note: item.note,
      };

      setTrips((current) =>
        mapTripById(current, tripId, (entry) => patchPackingListItem(entry, listId, itemId, patch)),
      );

      const repoPatch = {
        ...patch,
        note: patch.note !== undefined ? patch.note ?? '' : undefined,
      };

      void tripRepository
        .updatePackingItem(tripId, itemId, repoPatch, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, previous),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });

      return true;
    },
    [tripRepository],
  );

  const toggleNeedToBuy = useCallback(
    (itemId: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item) {
        return;
      }

      const previousNeedToBuy = item.needToBuy;
      const nextNeedToBuy = !previousNeedToBuy;
      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { needToBuy: nextNeedToBuy }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { needToBuy: nextNeedToBuy }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { needToBuy: previousNeedToBuy }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [tripRepository],
  );

  const markItemPurchased = useCallback(
    (itemId: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item || !item.needToBuy) {
        return;
      }

      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { needToBuy: false }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { needToBuy: false }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { needToBuy: true }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to update item');
        });
    },
    [tripRepository],
  );

  const assignItem = useCallback(
    (itemId: string, travelerId: string | null) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const item = trip ? findPackingItemInList(trip, listId, itemId) : undefined;
      if (!trip || !item) {
        return;
      }

      const previousAssignedTo = item.assignedTo;

      setTrips((current) =>
        mapTripById(current, tripId, (entry) =>
          patchPackingListItem(entry, listId, itemId, { assignedTo: travelerId }),
        ),
      );

      void tripRepository
        .updatePackingItem(tripId, itemId, { assignedTo: travelerId }, listId)
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              patchPackingListItem(entry, listId, itemId, { assignedTo: previousAssignedTo }),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to assign item');
        });
    },
    [tripRepository],
  );

  const deletePackingItem = useCallback(
    (itemId: string) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const items = trip ? getPackingListItems(trip, listId) : [];
      const originalIndex = items.findIndex((entry) => entry.id === itemId);
      const item = originalIndex >= 0 ? items[originalIndex] : undefined;
      if (!trip || !item || isImportantPackingItem(item)) {
        return;
      }

      const deletedItem = { ...item };

      setTrips((current) =>
        mapTripById(current, tripId, (entry) => removePackingListItem(entry, listId, itemId)),
      );

      void tripRepository.deletePackingItem(tripId, itemId, listId).catch((error) => {
        setTrips((current) =>
          mapTripById(current, tripId, (entry) => {
            const currentItems = getPackingListItems(entry, listId);
            if (currentItems.some((entryItem) => entryItem.id === itemId)) {
              return entry;
            }

            const restoredItems = [...currentItems];
            restoredItems.splice(Math.min(originalIndex, restoredItems.length), 0, deletedItem);
            return replacePackingListItems(entry, listId, restoredItems);
          }),
        );
        setRepositoryError(error instanceof Error ? error.message : 'Failed to delete item');
      });
    },
    [tripRepository],
  );

  const addPackingItem = useCallback(
    (input: {
      name: string;
      category: PackingCategory;
      quantity?: number;
      needToBuy?: boolean;
      assignedTo?: string | null;
    }) => {
      const tripId = activeTripIdRef.current;
      const listId = activePackingListIdRef.current;
      if (!tripId || !listId) {
        return;
      }

      const trimmed = input.name.trim();
      if (!trimmed) {
        return;
      }

      const optimisticId = createPackingItemId();
      const optimisticItem: PackingItem = {
        id: optimisticId,
        name: trimmed,
        category: input.category,
        quantity: input.quantity ?? 1,
        packed: false,
        needToBuy: input.needToBuy ?? false,
        assignedTo: input.assignedTo ?? null,
      };

      setTrips((current) =>
        mapTripById(current, tripId, (entry) => appendPackingListItem(entry, listId, optimisticItem)),
      );

      void tripRepository
        .addPackingItem(
          tripId,
          {
            id: optimisticId,
            name: trimmed,
            category: input.category,
            quantity: input.quantity,
            needToBuy: input.needToBuy,
            assignedTo: input.assignedTo,
          },
          listId,
        )
        .then((saved) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) => {
              const items = getPackingListItems(entry, listId);
              return replacePackingListItems(
                entry,
                listId,
                items.map((entryItem) => (entryItem.id === optimisticId ? saved : entryItem)),
              );
            }),
          );
        })
        .catch((error) => {
          setTrips((current) =>
            mapTripById(current, tripId, (entry) =>
              removePackingListItem(entry, listId, optimisticId),
            ),
          );
          setRepositoryError(error instanceof Error ? error.message : 'Failed to add item');
        });
    },
    [tripRepository],
  );

  const injectImportantItemsIntoList = useCallback(
    (tripId: string, listId: string, importantItems: ImportantItem[]) => {
      if (importantItems.length === 0) {
        return;
      }

      let previousItems: PackingItem[] | null = null;
      let nextItems: PackingItem[] | null = null;

      setTrips((current) => {
        const trip = current.find((entry) => entry.id === tripId);
        if (!trip) {
          return current;
        }

        previousItems = getPackingListItems(trip, listId);
        nextItems = mergeImportantItems(previousItems, importantItems);

        return mapTripById(current, tripId, (entry) =>
          replacePackingListItems(entry, listId, nextItems!),
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems, listId).catch((error) => {
        setTrips((latest) =>
          mapTripById(latest, tripId, (entry) =>
            replacePackingListItems(entry, listId, previousItems!),
          ),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to save important items',
        );
      });
    },
    [tripRepository],
  );

  const syncImportantSnapshotForList = useCallback(
    (tripId: string, listId: string, importantItems: ImportantItem[]) => {
      let previousItems: PackingItem[] | null = null;
      let nextItems: PackingItem[] | null = null;

      setTrips((current) => {
        const trip = current.find((entry) => entry.id === tripId);
        if (!trip) {
          return current;
        }

        previousItems = getPackingListItems(trip, listId);
        nextItems = syncTripImportantSnapshot(previousItems, importantItems);

        return mapTripById(current, tripId, (entry) =>
          replacePackingListItems(entry, listId, nextItems!),
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems, listId).catch((error) => {
        setTrips((latest) =>
          mapTripById(latest, tripId, (entry) =>
            replacePackingListItems(entry, listId, previousItems!),
          ),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to sync important items',
        );
      });
    },
    [tripRepository],
  );

  const injectImportantItemsIntoTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const listId = trip?.packingLists[0]?.id;
      if (!listId) {
        return;
      }

      injectImportantItemsIntoList(tripId, listId, importantItems);
    },
    [injectImportantItemsIntoList],
  );

  const syncImportantSnapshotForTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
      const trip = tripsRef.current.find((entry) => entry.id === tripId);
      const listId = activePackingListIdRef.current ?? trip?.packingLists[0]?.id;
      if (!listId) {
        return;
      }

      syncImportantSnapshotForList(tripId, listId, importantItems);
    },
    [syncImportantSnapshotForList],
  );

  const activeTrip = useMemo(
    () => findActiveTrip(trips, activeTripId),
    [trips, activeTripId],
  );

  const activePackingList = useMemo(() => {
    if (!activeTrip || !activePackingListId) {
      return null;
    }

    return findPackingListById(activeTrip, activePackingListId) ?? null;
  }, [activeTrip, activePackingListId]);

  const value = useMemo<TripsContextValue>(
    () => ({
      trips,
      activeTripId,
      activeTrip,
      activePackingListId,
      activePackingList,
      drafts: draftsState.drafts,
      activeDraftId: draftsState.activeDraftId,
      draft,
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      repositoryError,
      setActiveTripId,
      setActivePackingListId,
      beginTripPackEntry,
      selectActivePackingList,
      getDraftById,
      inProgressDraftsOrdered,
      listInProgressDraftsOrdered: listInProgressDraftsOrderedCallback,
      getPrimaryInProgressDraft,
      createNewDraft,
      resumeDraft,
      deleteDraft,
      setDraft,
      setDraftWizardStep,
      markDraftReachedSummary,
      resetDraft,
      saveDraftImportantItemsForProfile,
      dismissDraftImportantPromptForProfile,
      getActiveDraftImportantByProfileId,
      isCommitDraftInFlight,
      acknowledgeCommitDraftNavigation,
      refreshTrips,
      commitDraftTrip,
      archiveTrip,
      restoreTrip,
      deleteTripPermanently,
      updateTripSharedDetails,
      addTravellerToTrip,
      removeTravellerFromTrip,
      togglePacked,
      setItemQuantity,
      renamePackingItem,
      setPackingItemNote,
      updatePackingItemSettings,
      toggleNeedToBuy,
      markItemPurchased,
      assignItem,
      deletePackingItem,
      addPackingItem,
      injectImportantItemsIntoList,
      syncImportantSnapshotForList,
      injectImportantItemsIntoTrip,
      syncImportantSnapshotForTrip,
    }),
    [
      trips,
      activeTripId,
      activeTrip,
      activePackingListId,
      activePackingList,
      draftsState,
      inProgressDraftsOrdered,
      draft,
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      repositoryError,
      setActiveTripId,
      setActivePackingListId,
      beginTripPackEntry,
      selectActivePackingList,
      getDraftById,
      listInProgressDraftsOrderedCallback,
      getPrimaryInProgressDraft,
      createNewDraft,
      resumeDraft,
      deleteDraft,
      setDraft,
      setDraftWizardStep,
      markDraftReachedSummary,
      resetDraft,
      saveDraftImportantItemsForProfile,
      dismissDraftImportantPromptForProfile,
      getActiveDraftImportantByProfileId,
      isCommitDraftInFlight,
      acknowledgeCommitDraftNavigation,
      refreshTrips,
      commitDraftTrip,
      archiveTrip,
      restoreTrip,
      deleteTripPermanently,
      updateTripSharedDetails,
      addTravellerToTrip,
      removeTravellerFromTrip,
      togglePacked,
      setItemQuantity,
      renamePackingItem,
      setPackingItemNote,
      updatePackingItemSettings,
      toggleNeedToBuy,
      markItemPurchased,
      assignItem,
      deletePackingItem,
      addPackingItem,
      injectImportantItemsIntoList,
      syncImportantSnapshotForList,
      injectImportantItemsIntoTrip,
      syncImportantSnapshotForTrip,
    ],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripsProvider');
  }
  return context;
}
