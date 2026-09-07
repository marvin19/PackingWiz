import { getPersistenceMode, logPersistenceDiagnosticsDev } from '@/config/persistence';
import { getSupabaseClient } from '@/lib/supabase/client';
import { mockPackingProfileRepository } from '@/repositories/profiles/mock-packing-profile-repository';
import type { PackingProfileRepository } from '@/repositories/profiles/packing-profile-repository';
import { SupabasePackingProfileRepository } from '@/repositories/profiles/supabase-packing-profile-repository';
import { mockTripRepository } from '@/repositories/trips/mock-trip-repository';
import { SupabaseTripRepository } from '@/repositories/trips/supabase-trip-repository';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';
import type { WeatherService } from '@/services/weather/weather-service';

export interface AppServices {
  tripRepository: TripRepository;
  profileRepository: PackingProfileRepository;
  packingGenerator: PackingGenerator;
  weatherService: WeatherService;
}

export function createAppServices(): AppServices {
  const mode = getPersistenceMode();
  logPersistenceDiagnosticsDev();

  if (mode === 'supabase') {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is configured but the client could not be initialized');
    }

    return {
      tripRepository: new SupabaseTripRepository(client),
      profileRepository: new SupabasePackingProfileRepository(client),
      packingGenerator: mockPackingGenerator,
      weatherService: mockWeatherService,
    };
  }

  return {
    tripRepository: mockTripRepository,
    profileRepository: mockPackingProfileRepository,
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  };
}

export function getPersistenceModeLabel(): 'supabase' | 'mock' {
  return getPersistenceMode();
}
