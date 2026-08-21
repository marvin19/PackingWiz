import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { ImportantItem } from '@/domain/important-item';
import type { PackingMode, Trip } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
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
  draft: TripDraft,
  services: {
    packingGenerator: PackingGenerator;
    weatherService: WeatherService;
  },
  options: AssembleTripOptions,
): Promise<Trip> {
  const weather = await services.weatherService.getWeatherForTrip({ draft });

  let generatedItems: Trip['items'] = [];
  let insights: string[] = [];

  if (options.packingMode === 'generated') {
    const packing = await services.packingGenerator.generate({ draft });
    generatedItems = packing.items;
    insights = packing.insights;
  }

  const items = mergeImportantItems(generatedItems, options.importantItems ?? []);
  const destinationLabel = getDestinationLabel(draft.destination) || 'New trip';

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
    insights,
    packingMode: options.packingMode,
    generated: options.packingMode === 'generated',
    status: 'upcoming',
  };
}

export function getTripCountryLabel(trip: Trip): string {
  return getDestinationCountryLabel(trip.destination);
}
