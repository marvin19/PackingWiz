import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import type { TripWeather } from '@/domain/weather';
import { WeatherCard } from '@/features/trip-creation/components/weather-card';
import { useProfile } from '@/hooks/use-profile';

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

jest.mock('@/hooks/use-profile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

const coldWeather: TripWeather = {
  mode: 'climate',
  summary: 'Cold & snowy',
  detail: 'Below-freezing days with snow.',
  high: -2,
  low: -9,
};

describe('WeatherCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Fahrenheit temperatures when metricUnits is false', () => {
    mockUseProfile.mockReturnValue({
      preferences: { metricUnits: false },
    } as ReturnType<typeof useProfile>);

    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(<WeatherCard weather={coldWeather} />);
    });

    expect(JSON.stringify(tree!.toJSON())).toContain('28 °F / 16 °F');
  });
});
