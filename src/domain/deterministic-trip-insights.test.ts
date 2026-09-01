import { dedupeInsights, normalizeInsight } from '@/domain/insight';
import { generateDeterministicTripInsights } from '@/domain/deterministic-trip-insights';
import type { TripWeather } from '@/domain/weather';
import { applyTripSharedDetailsEdit } from '@/domain/trip-edit';
import { normalizeTrip } from '@/domain/trip-compatibility';
import { createDestinationFromText } from '@/domain/destination';

const rainyWeather: TripWeather = {
  mode: 'forecast',
  summary: 'Mixed sun and rain',
  detail: 'Rain expected on several days — pack layers you can adjust.',
  high: 23,
  low: 17,
  rainfall: 'Moderate',
  conditions: 'Mild with occasional rain',
  days: [
    { label: 'Mon', icon: 'partly', high: 22, low: 16 },
    { label: 'Tue', icon: 'rain', high: 19, low: 15 },
  ],
};

const mildWeather: TripWeather = {
  mode: 'climate',
  summary: 'Typical weather',
  detail: 'Mild days.',
  high: 20,
  low: 14,
  rainfall: 'Low',
};

describe('generateDeterministicTripInsights', () => {
  it('creates a meaningful rain packing insight from weather data', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Vacation'],
      laundry: 'unsure',
      weather: rainyWeather,
    });

    expect(insights.some((insight) => insight.id === 'insight-weather-rain')).toBe(true);
    expect(insights.find((insight) => insight.id === 'insight-weather-rain')?.body).toMatch(
      /rain protection/i,
    );
  });

  it('creates a laundry-available packing insight', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Vacation'],
      laundry: 'yes',
      weather: mildWeather,
    });

    expect(insights).toContainEqual(
      expect.objectContaining({
        id: 'insight-laundry-available',
        body: 'Laundry is available, so you can pack fewer everyday clothes.',
      }),
    );
  });

  it('creates a no-laundry packing insight', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Vacation'],
      laundry: 'no',
      weather: mildWeather,
    });

    expect(insights).toContainEqual(
      expect.objectContaining({
        id: 'insight-laundry-unavailable',
        body: 'No laundry is available, so the list accounts for needing enough clothing without washing.',
      }),
    );
  });

  it('does not treat laundry unsure as available or unavailable', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Vacation'],
      laundry: 'unsure',
      weather: mildWeather,
    });

    const unsureInsight = insights.find((insight) => insight.id === 'insight-laundry-unsure');

    expect(insights.some((insight) => insight.id === 'insight-laundry-available')).toBe(false);
    expect(insights.some((insight) => insight.id === 'insight-laundry-unavailable')).toBe(false);
    expect(unsureInsight).toBeDefined();
    expect(unsureInsight?.body).toMatch(/not sure about laundry access/i);
    expect(unsureInsight?.body).not.toMatch(/Laundry is available|No laundry is available/i);
    expect(unsureInsight?.body).not.toMatch(/\bwithout washing\b/i);
  });

  it('explains Business + Vacation packing consequences instead of repeating tags', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Business', 'Vacation'],
      laundry: 'yes',
      weather: mildWeather,
    });

    const contextInsight = insights.find((insight) => insight.id === 'insight-trip-context-business-vacation');
    expect(contextInsight?.body).toMatch(/workwear and casual clothing/i);
    expect(contextInsight?.body).not.toMatch(/Business · Vacation|Business, Vacation/i);
  });

  it('creates activity reasoning for a relevant single trip context', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Half marathon'],
      laundry: 'yes',
      weather: mildWeather,
    });

    expect(insights.some((insight) => insight.id === 'insight-trip-context-race')).toBe(true);
    expect(insights.find((insight) => insight.id === 'insight-trip-context-race')?.body).toMatch(
      /activity essentials/i,
    );
  });

  it('does not create filler trip-context insights for minimal context', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Vacation'],
      laundry: 'unsure',
      weather: mildWeather,
    });

    expect(insights.every((insight) => insight.category !== 'trip-context')).toBe(true);
  });

  it('returns deterministic output for identical input', () => {
    const input = {
      tripContext: ['Business', 'Vacation'],
      laundry: 'no' as const,
      weather: rainyWeather,
      note: 'Please pack light',
    };

    expect(generateDeterministicTripInsights(input)).toEqual(generateDeterministicTripInsights(input));
  });

  it('does not emit duplicate insights', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Business', 'Vacation', 'Running'],
      laundry: 'yes',
      weather: rainyWeather,
      note: 'pack light',
    });

    expect(insights).toEqual(dedupeInsights(insights));
  });

  it('does not mutate previously snapshotted insight records', () => {
    const snapshot = [
      normalizeInsight('Existing Me insight'),
      normalizeInsight('Shared laundry tip'),
    ];
    const before = snapshot.map((insight) => ({ ...insight }));

    dedupeInsights([...snapshot, normalizeInsight('Generated insight for Jonas')]);

    expect(snapshot).toEqual(before);
  });

  it('keeps warm-weather insight separate from rain insight when both apply', () => {
    const hotRainyWeather: TripWeather = {
      ...rainyWeather,
      high: 31,
      summary: 'Hot with rain showers',
    };

    const insights = generateDeterministicTripInsights({
      tripContext: ['Beach'],
      laundry: 'yes',
      weather: hotRainyWeather,
    });

    expect(insights.some((insight) => insight.id === 'insight-weather-rain')).toBe(true);
    expect(insights.some((insight) => insight.id === 'insight-weather-warm')).toBe(true);
  });
});

describe('trip insight snapshot semantics', () => {
  it('does not regenerate insights when shared trip details are edited', () => {
    const trip = normalizeTrip({
      id: 'trip-edit-insights',
      title: 'Oslo',
      destination: createDestinationFromText('Oslo', 'Norway'),
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      tripContext: ['City break'],
      accommodation: 'hotel',
      laundry: 'yes',
      note: '',
      weather: mildWeather,
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
      bags: [],
      insights: [normalizeInsight('Existing insight')],
      status: 'upcoming',
      packingMode: 'generated',
      generated: true,
      items: [],
    });

    const updated = applyTripSharedDetailsEdit(trip, {
      tripContext: ['Business', 'Vacation'],
      laundry: 'no',
    });

    expect(updated.insights).toEqual(trip.insights);
  });
});

describe('trip-level insight generation shape', () => {
  it('returns one shared trip-level set rather than per-person duplicates', () => {
    const insights = generateDeterministicTripInsights({
      tripContext: ['Business', 'Vacation'],
      laundry: 'yes',
      weather: rainyWeather,
    });

    expect(insights.filter((insight) => insight.category === 'trip-context')).toHaveLength(1);
    expect(insights.filter((insight) => insight.id === 'insight-laundry-available')).toHaveLength(1);
  });
});
