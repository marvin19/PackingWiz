import { getPersistenceMode, logPersistenceDiagnosticsDev } from '@/config/persistence';
import { getSupabaseClient } from '@/lib/supabase/client';
import { mockUserPreferencesRepository } from '@/repositories/preferences/mock-user-preferences-repository';
import type { UserPreferencesRepository } from '@/repositories/preferences/user-preferences-repository';
import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/supabase-user-preferences-repository';
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
  preferencesRepository: UserPreferencesRepository;
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
      preferencesRepository: new SupabaseUserPreferencesRepository(client),
      packingGenerator: mockPackingGenerator,
      weatherService: mockWeatherService,
    };
  }

  return {
    tripRepository: mockTripRepository,
    profileRepository: mockPackingProfileRepository,
    preferencesRepository: mockUserPreferencesRepository,
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  };
}

export function getPersistenceModeLabel(): 'supabase' | 'mock' {
  return getPersistenceMode();
}
