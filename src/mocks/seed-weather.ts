import type { TripWeather } from '@/domain/weather';

/** Climate snapshot — Tokyo & Kyoto (far-future trip). */
export const seedTokyoWeather: TripWeather = {
  mode: 'climate',
  summary: 'Typical October weather',
  detail:
    "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
  high: 22,
  low: 15,
  rainfall: 'Moderate',
  conditions: 'Mild with occasional rain',
  days: [{ label: 'Typical high', icon: 'partly', high: 22, low: 15 }],
};

/** Forecast snapshot — Lisbon city break (near-term style trip). */
export const seedLisbonWeather: TripWeather = {
  mode: 'forecast',
  summary: 'Warm and sunny',
  detail: 'A dry, bright few days perfect for exploring on foot.',
  high: 24,
  low: 16,
  days: [
    { label: 'Thu', icon: 'sun', high: 24, low: 16 },
    { label: 'Fri', icon: 'sun', high: 25, low: 17 },
    { label: 'Sat', icon: 'partly', high: 23, low: 15 },
  ],
};

/** Climate snapshot — Mallorca beach (hot destination fallback). */
export const seedMallorcaWeather: TripWeather = {
  mode: 'climate',
  summary: 'Hot & sunny',
  detail:
    "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
  high: 31,
  low: 24,
  rainfall: 'Low',
  conditions: 'Hot and mostly sunny',
  days: [{ label: 'Typical high', icon: 'sun', high: 31, low: 24 }],
};
