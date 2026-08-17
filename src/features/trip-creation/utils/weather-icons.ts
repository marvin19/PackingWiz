import type { WeatherIcon } from '@/domain/weather';
import type { TripFeatherIcon } from '@/features/trips/utils/trip-type-icon';

export function getWeatherFeatherIcon(icon: WeatherIcon): TripFeatherIcon {
  switch (icon) {
    case 'sun':
      return 'sun';
    case 'cloud':
      return 'cloud';
    case 'rain':
      return 'cloud-rain';
    case 'partly':
      return 'cloud';
    case 'snow':
      return 'cloud';
    default:
      return 'cloud';
  }
}
