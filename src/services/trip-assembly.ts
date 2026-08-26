import { getDestinationCountryLabel } from '@/domain/destination';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingMode, Trip } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { normalizeTripDraft } from '@/domain/trip-draft-profiles';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';

export type AssembleTripOptions = {
  packingMode: PackingMode;
  importantItems?: ImportantItem[];
};

/**
 * Composes a trip from draft data using injected services.
 * Generated mode requires PackingGenerator; manual mode skips it entirely.
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
  let weather: Trip['weather'];
  let generatedItems: Trip['items'] = [];
  let insights: string[] = [];

  if (options.packingMode === 'generated') {
    const [weatherResult, packing] = await Promise.all([
      services.weatherService.getWeatherForTrip({ draft }),
      services.packingGenerator.generate({ draft }),
    ]);
    weather = weatherResult;
    generatedItems = packing.items;
    insights = packing.insights;
  } else {
    weather = await services.weatherService.getWeatherForTrip({ draft });
  }

  const items = mergeImportantItems(generatedItems, options.importantItems ?? []);
  const tripName = suggestDefaultTripNameFromDestination(draft.destination);

  const legacyTrip: TripLike = {
    id: `trip-${Date.now()}`,
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
    items,
    insights,
    packingMode: options.packingMode,
    generated: options.packingMode === 'generated',
    status: 'upcoming',
  };

  return normalizeTrip(legacyTrip);
}

export function getTripCountryLabel(trip: Trip): string {
  return getDestinationCountryLabel(trip.destination);
}
