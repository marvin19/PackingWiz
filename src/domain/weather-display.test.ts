import {
  formatWeatherTemperature,
  formatWeatherTemperatureRange,
} from '@/domain/weather-display';
import { WEATHER_STORED_TEMPERATURE_UNIT } from '@/domain/weather';

describe('formatWeatherTemperature', () => {
  it('renders negative temperatures with an explicit unit', () => {
    expect(formatWeatherTemperature(-9)).toBe('-9 °C');
  });

  it('renders positive temperatures with an explicit unit', () => {
    expect(formatWeatherTemperature(24)).toBe('24 °C');
  });

  it('renders zero with an explicit unit', () => {
    expect(formatWeatherTemperature(0)).toBe('0 °C');
  });

  it('uses the canonical stored Celsius unit', () => {
    expect(formatWeatherTemperature(12)).toContain(`°${WEATHER_STORED_TEMPERATURE_UNIT}`);
    expect(formatWeatherTemperature(12)).not.toMatch(/^12°$/);
    expect(formatWeatherTemperature(12)).not.toMatch(/^12$/);
  });
});

describe('formatWeatherTemperatureRange', () => {
  it('formats high/low pairs without bare numeric temperatures', () => {
    expect(formatWeatherTemperatureRange(-2, -9)).toBe('-2 °C / -9 °C');
    expect(formatWeatherTemperatureRange(24, 16)).toBe('24 °C / 16 °C');
  });
});
