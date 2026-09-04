import type { Insight } from '@/domain/insight';
import type { TripDraft } from '@/domain/trip-draft';
import type { TripWeather } from '@/domain/weather';

export type InsightGenerationInput = {
  draft: TripDraft;
  weather: TripWeather;
};

export interface InsightGenerator {
  generate(input: InsightGenerationInput): Promise<Insight[]>;
}
