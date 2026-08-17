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
