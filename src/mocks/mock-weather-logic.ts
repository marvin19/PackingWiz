import type { TripDraft } from '@/domain/trip-draft';
import type { TripWeather } from '@/domain/weather';

function daysUntilStart(startDate: string): number {
  if (!startDate) {
    return 0;
  }
  const start = new Date(startDate);
  return Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isHotDestination(draft: TripDraft): boolean {
  const place = `${draft.destination} ${draft.country}`.toLowerCase();
  return ['bali', 'mallorca', 'hawaii', 'miami', 'phuket'].some((hot) => place.includes(hot));
}

function isColdDestination(draft: TripDraft): boolean {
  const place = `${draft.destination} ${draft.country}`.toLowerCase();
  return ['chamonix', 'alps', 'iceland', 'hokkaido'].some((cold) => place.includes(cold));
}

/**
 * Lightweight mock weather for development.
 */
export function buildMockWeather(draft: TripDraft): TripWeather {
  const daysAway = daysUntilStart(draft.startDate);
  const useClimate = daysAway > 14;

  if (isColdDestination(draft)) {
    const profile = {
      summary: 'Cold & snowy',
      detail: 'Below-freezing days with snow — pack proper insulation and waterproof layers.',
      high: -2,
      low: -9,
      rainfall: 'Snow',
      conditions: 'Cold with regular snowfall',
    };

    if (useClimate) {
      return {
        mode: 'climate',
        ...profile,
        detail:
          "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
      };
    }

    return {
      mode: 'forecast',
      ...profile,
      days: [
        { label: 'Mon', icon: 'snow', high: -1, low: -8 },
        { label: 'Tue', icon: 'snow', high: -3, low: -10 },
        { label: 'Wed', icon: 'cloud', high: 0, low: -6 },
      ],
    };
  }

  if (isHotDestination(draft)) {
    const profile = {
      summary: 'Hot & sunny',
      detail: 'Hot, sunny days throughout — pack light, breathable clothing and sun protection.',
      high: 31,
      low: 24,
      rainfall: 'Low',
      conditions: 'Hot and mostly sunny',
    };

    if (useClimate) {
      return { mode: 'climate', ...profile };
    }

    return {
      mode: 'forecast',
      ...profile,
      days: [
        { label: 'Mon', icon: 'sun', high: 31, low: 24 },
        { label: 'Tue', icon: 'sun', high: 32, low: 25 },
        { label: 'Wed', icon: 'partly', high: 30, low: 24 },
      ],
    };
  }

  const profile = {
    summary: 'Mixed sun and rain',
    detail: 'Rain expected on several days — pack layers you can adjust.',
    high: 23,
    low: 17,
    rainfall: 'Moderate',
    conditions: 'Mild with occasional rain',
  };

  if (useClimate) {
    return {
      mode: 'climate',
      summary: 'Typical weather',
      detail:
        "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
      high: profile.high,
      low: profile.low,
      rainfall: profile.rainfall,
      conditions: profile.conditions,
    };
  }

  return {
    mode: 'forecast',
    ...profile,
    days: [
      { label: 'Mon', icon: 'partly', high: 22, low: 16 },
      { label: 'Tue', icon: 'rain', high: 19, low: 15 },
      { label: 'Wed', icon: 'sun', high: 23, low: 17 },
    ],
  };
}
