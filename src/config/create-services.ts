import { getPersistenceMode } from '@/config/persistence';
import { getSupabaseClient } from '@/lib/supabase/client';
import { mockTripRepository } from '@/repositories/trips/mock-trip-repository';
import { SupabaseTripRepository } from '@/repositories/trips/supabase-trip-repository';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';
import type { WeatherService } from '@/services/weather/weather-service';

export interface AppServices {
  tripRepository: TripRepository;
  packingGenerator: PackingGenerator;
  weatherService: WeatherService;
}

export function createAppServices(): AppServices {
  const mode = getPersistenceMode();

  if (mode === 'supabase') {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is configured but the client could not be initialized');
    }

    return {
      tripRepository: new SupabaseTripRepository(client),
      packingGenerator: mockPackingGenerator,
      weatherService: mockWeatherService,
    };
  }

  return {
    tripRepository: mockTripRepository,
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  };
}

export function getPersistenceModeLabel(): 'supabase' | 'mock' {
  return getPersistenceMode();
}
