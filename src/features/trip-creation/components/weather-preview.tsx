import { useEffect, useState } from 'react';

import type { TripDraft } from '@/domain/trip-draft';
import type { TripWeather } from '@/domain/weather';
import { WeatherCard } from '@/features/trip-creation/components/weather-card';
import { useServices } from '@/providers/services-provider';

type WeatherPreviewProps = {
  draft: TripDraft;
};

export function WeatherPreview({ draft }: WeatherPreviewProps) {
  const { weatherService } = useServices();
  const [weather, setWeather] = useState<TripWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    weatherService
      .getWeatherForTrip({ draft })
      .then((result) => {
        if (mounted) {
          setWeather(result);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [draft, weatherService]);

  return <WeatherCard weather={weather} isLoading={isLoading} />;
}
