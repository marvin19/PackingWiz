import type { TripDraft } from '@/domain/trip-draft';
import type { TripWeather } from '@/domain/weather';

export interface WeatherRequest {
  draft: TripDraft;
}

export interface WeatherService {
  getWeatherForTrip(request: WeatherRequest): Promise<TripWeather>;
}
