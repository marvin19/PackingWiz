import { WEATHER_STORED_TEMPERATURE_UNIT } from '@/domain/weather';

export type WeatherTemperatureDisplayOptions = {
  metricUnits?: boolean;
};

/** Convert canonical Celsius to rounded Fahrenheit for display only. */
export function celsiusToFahrenheitDisplay(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/** User-facing temperature label — input is always canonical Celsius. */
export function formatWeatherTemperature(
  celsius: number,
  options: WeatherTemperatureDisplayOptions = {},
): string {
  const metricUnits = options.metricUnits ?? true;

  if (metricUnits) {
    return `${celsius} °${WEATHER_STORED_TEMPERATURE_UNIT}`;
  }

  return `${celsiusToFahrenheitDisplay(celsius)} °F`;
}

/** User-facing high/low range for trip or daily weather summaries. */
export function formatWeatherTemperatureRange(
  highCelsius: number,
  lowCelsius: number,
  options: WeatherTemperatureDisplayOptions = {},
): string {
  return `${formatWeatherTemperature(highCelsius, options)} / ${formatWeatherTemperature(lowCelsius, options)}`;
}
