import type { TripWeather, WeatherIcon } from '@/domain/weather';
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

/** Primary icon for a stored trip weather snapshot (forecast day or climate summary). */
export function getPrimaryWeatherIcon(weather: TripWeather): WeatherIcon {
  if (weather.days?.[0]?.icon) {
    return weather.days[0].icon;
  }

  const summary = weather.summary.toLowerCase();
  if (summary.includes('snow') || summary.includes('cold')) {
    return 'snow';
  }
  if (summary.includes('rain')) {
    return 'rain';
  }
  if (summary.includes('sun') || summary.includes('hot')) {
    return 'sun';
  }

  return 'partly';
}
