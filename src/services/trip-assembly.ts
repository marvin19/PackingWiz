import type { PackingMode, Trip } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { getDestinationCountryLabel } from '@/domain/destination';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile } from '@/domain/packing-profile';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import {
  buildPackingListForProfile,
  dedupeInsights,
  importantItemsForProfileList,
  uniquePackingProfilesById,
} from '@/domain/trip-packing-lists';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';

export type AssembleTripOptions = {
  packingMode: PackingMode;
  /** Canonical profile-scoped Important master store (MP4B). */
  importantByProfileId?: ImportantItemsByProfileId;
};

export type AssemblePackingListForProfileOptions = {
  tripId: string;
  packingMode: PackingMode;
  importantByProfileId?: ImportantItemsByProfileId;
};

export type AssemblePackingListForProfileResult = {
  list: PackingList;
  insights: string[];
};

/**
 * Create/populate one PackingList for a single profile.
 * Shared by initial trip assembly and MP5A add-traveller orchestration.
 */
export async function assemblePackingListForProfile(
  draft: TripDraft,
  profile: PackingProfile,
  services: { packingGenerator: PackingGenerator },
  options: AssemblePackingListForProfileOptions,
): Promise<AssemblePackingListForProfileResult> {
  const { tripId, packingMode, importantByProfileId = {} } = options;
  const profileImportant = importantItemsForProfileList(profile, importantByProfileId);

  if (packingMode === 'generated') {
    const packing = await services.packingGenerator.generate({ draft, profile });
    const items = mergeImportantItems(packing.items, profileImportant);

    return {
      list: buildPackingListForProfile(tripId, profile, packingMode, items),
      insights: packing.insights,
    };
  }

  const items = mergeImportantItems([], profileImportant);

  return {
    list: buildPackingListForProfile(tripId, profile, packingMode, items),
    insights: [],
  };
}

/**
 * Composes a trip from draft data using injected services.
 *
 * MP2B: one PackingList per selected PackingProfile; weather fetched once per trip.
 * MP4B: each list receives a snapshot of that profile's enabled Important master items.
 *
 * Weather before generation is intentional: target PackingGenerator input includes
 * TripWeather (PRODUCT.md / ARCHITECTURE.md). Fetch once per trip, then generate
 * per profile — do not parallelize weather with generation until weather is passed
 * into PackingGenerationInput and consumers no longer depend on implicit ordering.
 */
export async function assembleTripFromDraft(
  rawDraft: TripDraft,
  services: {
    packingGenerator: PackingGenerator;
    weatherService: WeatherService;
  },
  options: AssembleTripOptions,
): Promise<Trip> {
  const draft = normalizeTripDraft(rawDraft);
  const tripId = `trip-${Date.now()}`;
  const packingMode = options.packingMode;
  const profiles = uniquePackingProfilesById(draft.packingProfiles);
  const importantByProfileId = options.importantByProfileId ?? {};

  if (profiles.length === 0) {
    throw new Error('Trip draft has no packing profiles');
  }

  const weather = await services.weatherService.getWeatherForTrip({ draft });

  let packingLists: PackingList[];
  let insights: string[] = [];

  if (packingMode === 'generated') {
    const generationResults = await Promise.all(
      profiles.map(async (profile) =>
        assemblePackingListForProfile(draft, profile, services, {
          tripId,
          packingMode,
          importantByProfileId,
        }),
      ),
    );

    insights = dedupeInsights(generationResults.flatMap((result) => result.insights));
    packingLists = generationResults.map((result) => result.list);
  } else {
    packingLists = await Promise.all(
      profiles.map(async (profile) => {
        const result = await assemblePackingListForProfile(draft, profile, services, {
          tripId,
          packingMode,
          importantByProfileId,
        });
        return result.list;
      }),
    );
  }

  const primaryList = packingLists[0];
  const tripName = suggestDefaultTripNameFromDestination(draft.destination);

  const legacyTrip: TripLike = {
    id: tripId,
    title: tripName,
    destination: draft.destination,
    startDate: draft.startDate,
    endDate: draft.endDate,
    tripContext: draft.tripContext,
    accommodation: draft.accommodation ?? 'hotel',
    laundry: draft.laundry ?? 'unsure',
    travelers: draft.travelers,
    bags: draft.bags,
    note: draft.note,
    weather,
    packingLists,
    items: primaryList.items,
    insights,
    packingMode: primaryList.packingMode,
    generated: primaryList.packingMode === 'generated',
    status: 'upcoming',
  };

  return normalizeTrip(legacyTrip);
}

export function getTripCountryLabel(trip: Trip): string {
  return getDestinationCountryLabel(trip.destination);
}
