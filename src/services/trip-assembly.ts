import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { ImportantItem } from '@/domain/important-item';
import type { TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import { mergeImportantItems } from '@/services/packing/merge-important-items';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';

export interface TripAssemblyInput {
  draft: TripDraft;
  importantItems?: ImportantItem[];
}

/**
 * Composes a trip from draft data using injected services.
 * Keeps UI/providers free of direct knowledge of mock vs production backends.
 */
export async function assembleTripFromDraft(
  draft: TripDraft,
  services: {
    packingGenerator: PackingGenerator;
    weatherService: WeatherService;
  },
  options: { importantItems?: ImportantItem[] } = {},
): Promise<Trip> {
  const [weather, packing] = await Promise.all([
    services.weatherService.getWeatherForTrip({ draft }),
    services.packingGenerator.generate({ draft }),
  ]);

  const destinationLabel = getDestinationLabel(draft.destination) || 'New trip';
  const items = mergeImportantItems(packing.items, options.importantItems ?? []);

  return {
    id: `trip-${Date.now()}`,
    title: destinationLabel,
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
    insights: packing.insights,
    generated: true,
    status: 'upcoming',
  };
}

export function getTripCountryLabel(trip: Trip): string {
  return getDestinationCountryLabel(trip.destination);
}
