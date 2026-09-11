import { WEATHER_STORED_TEMPERATURE_UNIT } from '@/domain/weather';

/** User-facing temperature label — stored values are Celsius; conversion is Phase 5. */
export function formatWeatherTemperature(value: number): string {
  return `${value} °${WEATHER_STORED_TEMPERATURE_UNIT}`;
}

/** User-facing high/low range for trip or daily weather summaries. */
export function formatWeatherTemperatureRange(high: number, low: number): string {
  return `${formatWeatherTemperature(high)} / ${formatWeatherTemperature(low)}`;
}
