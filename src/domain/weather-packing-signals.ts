import type { TripWeather } from '@/domain/weather';

function weatherTextBlob(weather: TripWeather): string {
  return [weather.summary, weather.detail, weather.conditions, weather.rainfall]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function weatherSuggestsRainProtection(weather: TripWeather): boolean {
  if (weather.days?.some((day) => day.icon === 'rain')) {
    return true;
  }

  const text = weatherTextBlob(weather);

  if (text.includes('rain')) {
    return true;
  }

  const rainfall = weather.rainfall?.toLowerCase() ?? '';
  return rainfall.length > 0 && !rainfall.includes('low');
}

export function weatherSuggestsColdLayering(weather: TripWeather): boolean {
  if (weather.days?.some((day) => day.icon === 'snow')) {
    return true;
  }

  const text = weatherTextBlob(weather);

  if (text.includes('cold') || text.includes('snow') || text.includes('freez')) {
    return true;
  }

  return weather.low <= 8 || weather.high <= 12;
}

export function weatherSuggestsLightweightClothing(weather: TripWeather): boolean {
  if (weatherSuggestsColdLayering(weather)) {
    return false;
  }

  if (weather.high >= 28) {
    return true;
  }

  const text = weatherTextBlob(weather);
  return text.includes('hot') && weather.high >= 24;
}
