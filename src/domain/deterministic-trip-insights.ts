import type { Insight } from '@/domain/insight';
import { dedupeInsights } from '@/domain/insight';
import type { LaundryOption } from '@/domain/trip';
import { tripContextIncludes } from '@/domain/trip-context-tags';
import type { TripWeather } from '@/domain/weather';
import {
  weatherSuggestsColdLayering,
  weatherSuggestsLightweightClothing,
  weatherSuggestsRainProtection,
} from '@/domain/weather-packing-signals';

export type DeterministicTripInsightInput = {
  tripContext: string[];
  laundry: LaundryOption;
  weather: TripWeather;
  note?: string;
};

function buildWeatherInsights(weather: TripWeather): Insight[] {
  const insights: Insight[] = [];

  if (weatherSuggestsRainProtection(weather)) {
    insights.push({
      id: 'insight-weather-rain',
      category: 'weather',
      title: 'Rain expected',
      body: 'Rain is expected on several days, so PackingWiz included rain protection.',
    });
  }

  if (weatherSuggestsColdLayering(weather)) {
    insights.push({
      id: 'insight-weather-cold',
      category: 'weather',
      title: 'Cool conditions',
      body: 'Cool conditions are expected, so layering is important for this trip.',
    });
  } else if (weatherSuggestsLightweightClothing(weather)) {
    insights.push({
      id: 'insight-weather-warm',
      category: 'weather',
      title: 'Warm conditions',
      body: 'Warm conditions are expected, so the list prioritizes lightweight clothing.',
    });
  }

  return insights;
}

function buildLaundryInsight(laundry: LaundryOption): Insight | null {
  if (laundry === 'yes') {
    return {
      id: 'insight-laundry-available',
      category: 'laundry',
      title: 'Laundry available',
      body: 'Laundry is available, so you can pack fewer everyday clothes.',
    };
  }

  if (laundry === 'no') {
    return {
      id: 'insight-laundry-unavailable',
      category: 'laundry',
      title: 'No laundry',
      body: 'No laundry is available, so the list accounts for needing enough clothing without washing.',
    };
  }

  return {
    id: 'insight-laundry-unsure',
    category: 'laundry',
    title: 'Laundry uncertain',
    body:
      "You're not sure about laundry access, so PackingWiz included enough everyday clothing to cover the trip without relying on washing.",
  };
}

function includesActivityKeyword(tripContext: string[], keywords: string[]): boolean {
  const lowerTags = tripContext.map((tag) => tag.toLowerCase());

  return lowerTags.some((tag) => keywords.some((keyword) => tag.includes(keyword)));
}

function buildTripContextInsights(tripContext: string[]): Insight[] {
  const insights: Insight[] = [];
  const hasBusiness = tripContextIncludes(tripContext, 'Business');
  const hasVacation = tripContextIncludes(tripContext, 'Vacation');

  if (hasBusiness && hasVacation) {
    insights.push({
      id: 'insight-trip-context-business-vacation',
      category: 'trip-context',
      title: 'Business and vacation',
      body:
        'This trip combines business and vacation, so the packing recommendations account for both workwear and casual clothing.',
    });
    return insights;
  }

  if (hasBusiness) {
    insights.push({
      id: 'insight-trip-context-business',
      category: 'trip-context',
      title: 'Business travel',
      body: 'Business travel is part of this trip, so the list includes appropriate workwear.',
    });
  }

  if (
    tripContextIncludes(tripContext, 'Half marathon') ||
    includesActivityKeyword(tripContext, ['marathon', 'running'])
  ) {
    insights.push({
      id: 'insight-trip-context-race',
      category: 'trip-context',
      title: 'Race day',
      body: 'A race is part of this trip, so PackingWiz included relevant activity essentials.',
    });
  } else if (tripContextIncludes(tripContext, 'Hiking')) {
    insights.push({
      id: 'insight-trip-context-hiking',
      category: 'trip-context',
      title: 'Hiking',
      body: 'Hiking is part of this trip, so PackingWiz included suitable footwear and outdoor layers.',
    });
  } else if (tripContextIncludes(tripContext, 'Beach')) {
    insights.push({
      id: 'insight-trip-context-beach',
      category: 'trip-context',
      title: 'Beach time',
      body: 'Beach time is planned, so swimwear and sun protection are accounted for.',
    });
  } else if (tripContextIncludes(tripContext, 'Skiing')) {
    insights.push({
      id: 'insight-trip-context-skiing',
      category: 'trip-context',
      title: 'Skiing',
      body: 'Skiing is part of this trip, so cold-weather and slope-ready gear are included.',
    });
  } else if (includesActivityKeyword(tripContext, ['cycling'])) {
    insights.push({
      id: 'insight-trip-context-cycling',
      category: 'trip-context',
      title: 'Cycling',
      body: 'Cycling is part of this trip, so relevant riding gear and repair basics are considered.',
    });
  } else if (tripContextIncludes(tripContext, 'Wedding')) {
    insights.push({
      id: 'insight-trip-context-wedding',
      category: 'trip-context',
      title: 'Wedding',
      body: 'A wedding is part of this trip, so the list includes appropriate formal attire.',
    });
  }

  return insights;
}

function buildSpecialConsiderationInsights(note: string | undefined): Insight[] {
  const normalized = note?.trim().toLowerCase() ?? '';

  if (!normalized.includes('pack light') && !normalized.includes('pack relatively light')) {
    return [];
  }

  return [
    {
      id: 'insight-special-pack-light',
      category: 'special-consideration',
      title: 'Packing light',
      body: 'You asked to pack light, so the list focuses on versatile pieces you can mix and match.',
    },
  ];
}

/**
 * Pure trip-level insight generator for v1 deterministic assembly.
 * Returns packing reasoning only — never raw trip facts.
 */
export function generateDeterministicTripInsights(
  input: DeterministicTripInsightInput,
): Insight[] {
  const candidates: Insight[] = [
    ...buildWeatherInsights(input.weather),
    ...(() => {
      const laundryInsight = buildLaundryInsight(input.laundry);
      return laundryInsight ? [laundryInsight] : [];
    })(),
    ...buildTripContextInsights(input.tripContext),
    ...buildSpecialConsiderationInsights(input.note),
  ];

  return dedupeInsights(candidates);
}
