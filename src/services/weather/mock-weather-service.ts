import type { WeatherRequest, WeatherService } from '@/services/weather/weather-service';
import type { TripWeather } from '@/domain/weather';
import { buildMockWeather } from '@/mocks/mock-weather-logic';

export class MockWeatherService implements WeatherService {
  async getWeatherForTrip(request: WeatherRequest): Promise<TripWeather> {
    return buildMockWeather(request.draft);
  }
}

export const mockWeatherService = new MockWeatherService();
