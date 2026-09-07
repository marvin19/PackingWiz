import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { resolveActiveDraftIdForMutation } from '@/domain/trip-drafts-state';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import type { Trip } from '@/domain/trip';
import { cloneTrip } from '@/lib/clone-trip';
import { mockMallorcaTrip } from '@/mocks/seed-trips';
import { TripsProvider, useTrips, type TripsContextValue } from '@/providers/trips-provider';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

let tripsContext: TripsContextValue | null = null;
const mockRememberPackingProfile = jest.fn();

function currentTripsContext(): TripsContextValue | null {
  return tripsContext;
}

function createTripRepositoryMock(initialTrips: Trip[]): TripRepository & {
  getAll: jest.Mock;
  createTrip: jest.Mock;
} {
  let trips = initialTrips.map((trip) => cloneTrip(trip));

  return {
    getAll: jest.fn(async () => trips.map((trip) => cloneTrip(trip))),
    getById: jest.fn(async (id: string) => trips.find((entry) => entry.id === id) ?? null),
    save: jest.fn(async (trip: Trip) => trip),
    createTrip: jest.fn(async (trip: Trip) => {
      trips = [cloneTrip(trip), ...trips.filter((entry) => entry.id !== trip.id)];
      return cloneTrip(trip);
    }),
    delete: jest.fn(async (id: string) => {
      trips = trips.filter((entry) => entry.id !== id);
    }),
    updatePackingItem: jest.fn(),
    addPackingItem: jest.fn(),
    deletePackingItem: jest.fn(),
    updateTripPackingItems: jest.fn(),
  };
}

function createProfileRepositoryMock(): PackingProfileRepository & {
  loadAll: jest.Mock;
  saveProfile: jest.Mock;
  saveImportantMaster: jest.Mock;
  deleteProfile: jest.Mock;
} {
  return {
    loadAll: jest.fn(async () => ({ profiles: [], importantByProfileId: {} })),
    saveProfile: jest.fn(async (profile) => ({ ...profile })),
    saveImportantMaster: jest.fn(async () => undefined),
    deleteProfile: jest.fn(async () => undefined),
  };
}

const mockTripRepository = createTripRepositoryMock([]);
const mockProfileRepository = createProfileRepositoryMock();

jest.mock('@/config/persistence', () => ({
  getPersistenceMode: jest.fn(() => 'supabase' as const),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthReady: true,
    authError: null,
    userId: 'user-test',
  }),
}));

jest.mock('@/providers/profile-provider', () => ({
  useProfile: () => ({
    importantByProfileId: {},
    rememberPackingProfile: mockRememberPackingProfile,
    purgeImportantProfileIds: jest.fn(),
    savedPackingProfiles: [],
  }),
}));

jest.mock('@/providers/services-provider', () => ({
  useServices: () => ({
    tripRepository: mockTripRepository,
    profileRepository: mockProfileRepository,
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  }),
}));

function TripsProbe() {
  const context = useTrips();
  useEffect(() => {
    tripsContext = context;
  }, [context]);
  return null;
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mountTripsProvider(initialTrips: Trip[] = []): Promise<void> {
  Object.assign(mockTripRepository, createTripRepositoryMock(initialTrips));
  Object.assign(mockProfileRepository, createProfileRepositoryMock());
  mockRememberPackingProfile.mockImplementation(() => undefined);
  tripsContext = null;

  await act(async () => {
    TestRenderer.create(
      <TripsProvider>
        <TripsProbe />
      </TripsProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (currentTripsContext()) {
      break;
    }
    await flushAsync();
  }
}

function seedRememberedEmilieDraft(): void {
  act(() => {
    tripsContext!.createNewDraft();
    tripsContext!.setDraft({
      destination: createDestinationFromText('Oslo', 'Norway'),
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      tripContext: ['City'],
      accommodation: 'hotel',
      laundry: 'no',
      packingProfiles: [
        { id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true },
        {
          id: 'draft-profile-emilie',
          name: 'Emilie',
          age: 8,
          isSelf: false,
          rememberForFutureTrips: true,
        },
      ],
    });
    tripsContext!.markDraftReachedSummary();
  });
}

function hasValidActiveDraft(): boolean {
  return (
    resolveActiveDraftIdForMutation({
      drafts: tripsContext!.drafts,
      activeDraftId: tripsContext!.activeDraftId,
    }) !== null
  );
}

describe('TripsProvider post-commit profile persistence (VH2-F)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await mountTripsProvider();
  });

  it('keeps committed Trip and surfaces profile error when profile persistence fails after createTrip', async () => {
    seedRememberedEmilieDraft();
    mockProfileRepository.saveProfile.mockRejectedValueOnce(new Error('profile save failed'));

    let saved!: Trip;
    await act(async () => {
      saved = await tripsContext!.commitDraftTrip('manual');
    });
    await flushAsync();

    expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(1);
    expect(tripsContext!.trips.some((trip) => trip.id === saved.id)).toBe(true);
    expect(hasValidActiveDraft()).toBe(false);
    expect(tripsContext!.activeTripId).toBe(saved.id);
    expect(tripsContext!.repositoryError).toBe('profile save failed');
    expect(mockRememberPackingProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^profile-/),
        name: 'Emilie',
      }),
      expect.any(Object),
    );
    expect(mockRememberPackingProfile.mock.calls[0]?.[0]?.id).not.toContain('draft-profile');
  });

  it('does not retry createTrip when profile persistence fails', async () => {
    seedRememberedEmilieDraft();
    mockProfileRepository.saveProfile.mockRejectedValueOnce(new Error('profile save failed'));

    await act(async () => {
      await tripsContext!.commitDraftTrip('manual');
    });
    await flushAsync();

    expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(1);
    expect(tripsContext!.trips).toHaveLength(1);
  });

  it('skips reusable profile persistence when Remember is OFF', async () => {
    act(() => {
      tripsContext!.createNewDraft();
      tripsContext!.setDraft({
        destination: createDestinationFromText('Oslo', 'Norway'),
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        tripContext: ['City'],
        accommodation: 'hotel',
        laundry: 'no',
        packingProfiles: [
          { id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true },
          {
            id: 'draft-profile-emilie',
            name: 'Emilie',
            age: 8,
            isSelf: false,
            rememberForFutureTrips: false,
          },
        ],
      });
      tripsContext!.markDraftReachedSummary();
    });

    await act(async () => {
      await tripsContext!.commitDraftTrip('manual');
    });
    await flushAsync();

    expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(1);
    expect(mockProfileRepository.saveProfile).not.toHaveBeenCalled();
    expect(mockProfileRepository.saveImportantMaster).not.toHaveBeenCalled();
    expect(mockRememberPackingProfile).not.toHaveBeenCalled();
    expect(tripsContext!.repositoryError).toBeNull();
  });

  it('keeps reused Trip committed when remembered traveller profile persistence fails', async () => {
    const source = cloneTrip(mockMallorcaTrip);
    await mountTripsProvider([source]);
    await flushAsync();

    mockProfileRepository.saveProfile.mockRejectedValueOnce(new Error('reuse profile failed'));

    let reused!: Trip;
    await act(async () => {
      reused = await tripsContext!.reuseTrip(source.id, {
        packingListIds: [source.packingLists[0]!.id],
        sharedDetails: {
          destination: createDestinationFromText('Bergen', 'Norway'),
          startDate: '2026-11-01',
          endDate: '2026-11-07',
        },
        newTravellers: [
          {
            profile: {
              id: 'draft-profile-jonas',
              name: 'Jonas',
              age: 10,
              isSelf: false,
              rememberForFutureTrips: true,
            },
            packingMode: 'manual',
          },
        ],
      });
    });
    await flushAsync();

    expect(tripsContext!.trips.some((trip) => trip.id === reused!.id)).toBe(true);
    expect(tripsContext!.trips.some((trip) => trip.id === source.id)).toBe(true);
    expect(tripsContext!.repositoryError).toBe('reuse profile failed');
    expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(1);
  });
});
