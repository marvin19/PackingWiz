import type { TripDraft } from '@/domain/trip-draft';
import type { Trip } from '@/domain/trip';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';

export interface TripAssemblyInput {
  draft: TripDraft;
}

export interface TripAssemblyResult {
  trip: Omit<Trip, 'id'> & { id?: string };
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
): Promise<Trip> {
  const [weather, packing] = await Promise.all([
    services.weatherService.getWeatherForTrip({ draft }),
    services.packingGenerator.generate({ draft }),
  ]);

  return {
    id: `trip-${Date.now()}`,
    title: draft.destination || 'New trip',
    destination: draft.destination || 'New trip',
    country: draft.country || '',
    startDate: draft.startDate,
    endDate: draft.endDate,
    types: draft.types.length > 0 ? draft.types : ['vacation'],
    activities: draft.activities,
    accommodation: draft.accommodation ?? 'hotel',
    laundry: draft.laundry ?? 'unsure',
    travelers: draft.travelers,
    bags: draft.bags,
    note: draft.note,
    weather,
    items: packing.items,
    insights: packing.insights,
    generated: true,
    status: 'upcoming',
  };
}
