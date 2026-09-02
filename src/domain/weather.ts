export type WeatherMode = 'forecast' | 'climate';

export type WeatherIcon = 'sun' | 'cloud' | 'rain' | 'partly' | 'snow';

export interface WeatherDay {
  label: string;
  icon: WeatherIcon;
  high: number;
  low: number;
}

export interface TripWeather {
  mode: WeatherMode;
  summary: string;
  detail: string;
  high: number;
  low: number;
  rainfall?: string;
  conditions?: string;
  days?: WeatherDay[];
}

/** Canonical empty weather for trips without a fetched snapshot (reuse, Supabase reload gaps). */
export function emptyTripWeather(): TripWeather {
  return {
    mode: 'climate',
    summary: '',
    detail: '',
    high: 0,
    low: 0,
  };
}
