/** Canonical unit for stored TripWeather and WeatherDay temperature values. */
export const WEATHER_STORED_TEMPERATURE_UNIT = 'C';

export type WeatherMode = 'forecast' | 'climate';

export type WeatherIcon = 'sun' | 'cloud' | 'rain' | 'partly' | 'snow';

export interface WeatherDay {
  label: string;
  icon: WeatherIcon;
  /** Daily high in {@link WEATHER_STORED_TEMPERATURE_UNIT}. */
  high: number;
  /** Daily low in {@link WEATHER_STORED_TEMPERATURE_UNIT}. */
  low: number;
}

export interface TripWeather {
  mode: WeatherMode;
  summary: string;
  detail: string;
  /** Trip-period high in {@link WEATHER_STORED_TEMPERATURE_UNIT}. */
  high: number;
  /** Trip-period low in {@link WEATHER_STORED_TEMPERATURE_UNIT}. */
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
