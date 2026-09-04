import { generateDeterministicTripInsights } from '@/domain/deterministic-trip-insights';
import type { InsightGenerator } from '@/services/insights/insight-generator';

export const deterministicInsightGenerator: InsightGenerator = {
  async generate({ draft, weather }) {
    return generateDeterministicTripInsights({
      tripContext: draft.tripContext,
      laundry: draft.laundry ?? 'unsure',
      weather,
      note: draft.note,
    });
  },
};
