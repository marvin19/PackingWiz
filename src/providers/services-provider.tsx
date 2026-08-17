import { createContext, useContext, type ReactNode } from 'react';

import type { PackingGenerator } from '@/services/packing/packing-generator';
import type { WeatherService } from '@/services/weather/weather-service';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';
import { mockTripRepository } from '@/repositories/trips/mock-trip-repository';

export interface Services {
  tripRepository: TripRepository;
  packingGenerator: PackingGenerator;
  weatherService: WeatherService;
}

const defaultServices: Services = {
  tripRepository: mockTripRepository,
  packingGenerator: mockPackingGenerator,
  weatherService: mockWeatherService,
};

const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({
  children,
  services = defaultServices,
}: {
  children: ReactNode;
  services?: Services;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  return useContext(ServicesContext);
}
