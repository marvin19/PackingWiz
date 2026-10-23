import {
  celsiusToFahrenheitDisplay,
  formatWeatherTemperature,
  formatWeatherTemperatureRange,
} from '@/domain/weather-display';
import { WEATHER_STORED_TEMPERATURE_UNIT } from '@/domain/weather';

describe('celsiusToFahrenheitDisplay', () => {
  it('rounds Fahrenheit to the nearest integer', () => {
    expect(celsiusToFahrenheitDisplay(-9)).toBe(16);
    expect(celsiusToFahrenheitDisplay(0)).toBe(32);
    expect(celsiusToFahrenheitDisplay(24)).toBe(75);
    expect(celsiusToFahrenheitDisplay(-2)).toBe(28);
  });
});

describe('formatWeatherTemperature', () => {
  describe('metric', () => {
    it('renders negative temperatures with an explicit Celsius unit', () => {
      expect(formatWeatherTemperature(-9, { metricUnits: true })).toBe('-9 °C');
    });

    it('renders zero with an explicit Celsius unit', () => {
      expect(formatWeatherTemperature(0, { metricUnits: true })).toBe('0 °C');
    });

    it('renders positive temperatures with an explicit Celsius unit', () => {
      expect(formatWeatherTemperature(24, { metricUnits: true })).toBe('24 °C');
    });
  });

  describe('imperial', () => {
    it('renders negative Celsius values as rounded Fahrenheit', () => {
      expect(formatWeatherTemperature(-9, { metricUnits: false })).toBe('16 °F');
    });

    it('renders zero Celsius as 32 Fahrenheit', () => {
      expect(formatWeatherTemperature(0, { metricUnits: false })).toBe('32 °F');
    });

    it('renders positive Celsius values as rounded Fahrenheit', () => {
      expect(formatWeatherTemperature(24, { metricUnits: false })).toBe('75 °F');
    });
  });

  it('defaults to metric when preference is omitted', () => {
    expect(formatWeatherTemperature(12)).toBe('12 °C');
    expect(formatWeatherTemperature(12)).toContain(`°${WEATHER_STORED_TEMPERATURE_UNIT}`);
  });

  it('does not mutate the canonical Celsius input value', () => {
    const celsius = -9;
    formatWeatherTemperature(celsius, { metricUnits: false });
    expect(celsius).toBe(-9);
  });
});

describe('formatWeatherTemperatureRange', () => {
  it('formats metric high/low pairs', () => {
    expect(formatWeatherTemperatureRange(-2, -9, { metricUnits: true })).toBe('-2 °C / -9 °C');
    expect(formatWeatherTemperatureRange(24, 16, { metricUnits: true })).toBe('24 °C / 16 °C');
  });

  it('formats imperial high/low pairs from canonical Celsius inputs', () => {
    expect(formatWeatherTemperatureRange(-2, -9, { metricUnits: false })).toBe('28 °F / 16 °F');
  });

  it('does not mutate canonical Celsius inputs', () => {
    const high = -2;
    const low = -9;
    formatWeatherTemperatureRange(high, low, { metricUnits: false });
    expect(high).toBe(-2);
    expect(low).toBe(-9);
  });
});
