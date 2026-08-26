import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import { findActiveTrip, reconcileActiveTripId } from '@/domain/packing-stats';
import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import { createEmptyTripDraft, type TripDraft } from '@/domain/trip-draft';
import type { PackingList } from '@/domain/packing-list';
import type { PackingMode, Trip } from '@/domain/trip';
import {
  appendPackingListItem,
  findPackingItemInList,
  findPackingListById,
  getPackingListItems,
  getTripPackingItems,
  patchPackingListItem,
  removePackingListItem,
  replacePackingListItems,
  replacePrimaryPackingItems,
} from '@/domain/trip-compatibility';
import { createPackingItemId } from '@/lib/id';
import { WIZARD_STEP_COUNT } from '@/features/trip-creation/constants';
import { useAuth } from '@/providers/auth-provider';
import { useProfile } from '@/providers/profile-provider';
import { useServices } from '@/providers/services-provider';
import { assembleTripFromDraft } from '@/services/trip-assembly';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import { syncTripImportantSnapshot } from '@/services/packing/sync-important-snapshot';

export type AppTab = 'trips' | 'pack' | 'profile';

interface TripsContextValue {
  trips: Trip[];
  activeTripId: string | null;
  activeTrip: Trip | null;
  activePackingListId: string | null;
  activePackingList: PackingList | null;
  draft: TripDraft;
  draftWizardStep: number;
  draftReachedSummary: boolean;
  isLoading: boolean;
  repositoryError: string | null;
  setActiveTripId: (tripId: string | null) => void;
  setActivePackingListId: (packingListId: string | null) => void;
  /** Select trip + reconcile packing list (primary compatibility fallback for multi-list until MP3B). */
  openPackingList: (tripId: string, packingListId?: string) => void;
  setDraft: (patch: Partial<TripDraft>) => void;
  setDraftWizardStep: (step: number) => void;
  markDraftReachedSummary: () => void;
  resetDraft: () => void;
  refreshTrips: () => Promise<void>;
  commitDraftTrip: (packingMode?: PackingMode) => Promise<Trip>;
  togglePacked: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  renamePackingItem: (itemId: string, name: string) => void;
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
  injectImportantItemsIntoTrip: (tripId: string, importantItems: ImportantItem[]) => void;
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
  if (explicitListId && tripId) {
    const trip = trips.find((entry) => entry.id === tripId);
    if (trip?.packingLists.some((list) => list.id === explicitListId)) {
      return explicitListId;
    }
  }

  const carryListId = tripId && tripId === previousTripId ? previousListId : null;
  return reconcileActivePackingListId(tripId, carryListId, trips, {
    allowPrimaryCompatibilityFallback: true,
  }).activePackingListId;
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { tripRepository, packingGenerator, weatherService } = useServices();
  const { isAuthReady, authError } = useAuth();
  const { enabledImportantItems } = useProfile();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [activePackingListId, setActivePackingListIdState] = useState<string | null>(null);
  const [draft, setDraftState] = useState<TripDraft>(createEmptyTripDraft());
  const [draftWizardStep, setDraftWizardStep] = useState(0);
  const [draftReachedSummary, setDraftReachedSummary] = useState(false);
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

  const openPackingList = useCallback(
    (tripId: string, packingListId?: string) => {
      const previousTripId = activeTripIdRef.current;
      setActiveTripIdState(tripId);
      setActivePackingListIdState(
        resolvePackingListSelection(
          tripId,
          previousTripId,
          activePackingListIdRef.current,
          tripsRef.current,
          packingListId,
        ),
      );
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

  const setDraft = useCallback((patch: Partial<TripDraft>) => {
    setDraftState((current) => ({ ...current, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(createEmptyTripDraft());
    setDraftWizardStep(0);
    setDraftReachedSummary(false);
  }, []);

  const markDraftReachedSummary = useCallback(() => {
    setDraftReachedSummary(true);
    setDraftWizardStep(WIZARD_STEP_COUNT - 1);
  }, []);

  const commitDraftTrip = useCallback(
    async (packingMode: PackingMode = 'generated') => {
      if (commitDraftInFlightRef.current) {
        return commitDraftInFlightRef.current;
      }

      const promise = (async () => {
        const assembled = await assembleTripFromDraft(
          draft,
          {
            packingGenerator,
            weatherService,
          },
          { packingMode, importantItems: enabledImportantItems },
        );
        const saved = await tripRepository.createTrip(assembled);
        setTrips((current) => {
          const withoutDuplicate = current.filter((trip) => trip.id !== saved.id);
          return [saved, ...withoutDuplicate];
        });
        setActiveTripIdState(saved.id);
        setActivePackingListIdState(
          resolvePackingListSelection(saved.id, null, null, [saved, ...tripsRef.current.filter((t) => t.id !== saved.id)]),
        );
        setDraftState(createEmptyTripDraft());
        setDraftWizardStep(0);
        setDraftReachedSummary(false);
        setRepositoryError(null);
        return saved;
      })().catch((error) => {
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
    [draft, enabledImportantItems, packingGenerator, weatherService, tripRepository],
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

  const injectImportantItemsIntoTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
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

        previousItems = getTripPackingItems(trip);
        nextItems = mergeImportantItems(previousItems, importantItems);

        return mapTripById(current, tripId, (entry) =>
          replacePrimaryPackingItems(entry, nextItems!),
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems).catch((error) => {
        setTrips((latest) =>
          mapTripById(latest, tripId, (entry) => replacePrimaryPackingItems(entry, previousItems!)),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to save important items',
        );
      });
    },
    [tripRepository],
  );

  const syncImportantSnapshotForTrip = useCallback(
    (tripId: string, importantItems: ImportantItem[]) => {
      let previousItems: PackingItem[] | null = null;
      let nextItems: PackingItem[] | null = null;

      setTrips((current) => {
        const trip = current.find((entry) => entry.id === tripId);
        if (!trip) {
          return current;
        }

        previousItems = getTripPackingItems(trip);
        nextItems = syncTripImportantSnapshot(previousItems, importantItems);

        return mapTripById(current, tripId, (entry) =>
          replacePrimaryPackingItems(entry, nextItems!),
        );
      });

      if (!nextItems || !previousItems) {
        return;
      }

      void tripRepository.updateTripPackingItems(tripId, nextItems).catch((error) => {
        setTrips((latest) =>
          mapTripById(latest, tripId, (entry) => replacePrimaryPackingItems(entry, previousItems!)),
        );
        setRepositoryError(
          error instanceof Error ? error.message : 'Failed to sync important items',
        );
      });
    },
    [tripRepository],
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
      draft,
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      repositoryError,
      setActiveTripId,
      setActivePackingListId,
      openPackingList,
      setDraft,
      setDraftWizardStep,
      markDraftReachedSummary,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
      togglePacked,
      setItemQuantity,
      renamePackingItem,
      toggleNeedToBuy,
      markItemPurchased,
      assignItem,
      deletePackingItem,
      addPackingItem,
      injectImportantItemsIntoTrip,
      syncImportantSnapshotForTrip,
    }),
    [
      trips,
      activeTripId,
      activeTrip,
      activePackingListId,
      activePackingList,
      draft,
      draftWizardStep,
      draftReachedSummary,
      isLoading,
      repositoryError,
      setActiveTripId,
      setActivePackingListId,
      openPackingList,
      setDraft,
      markDraftReachedSummary,
      resetDraft,
      refreshTrips,
      commitDraftTrip,
      togglePacked,
      setItemQuantity,
      renamePackingItem,
      toggleNeedToBuy,
      markItemPurchased,
      assignItem,
      deletePackingItem,
      addPackingItem,
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
