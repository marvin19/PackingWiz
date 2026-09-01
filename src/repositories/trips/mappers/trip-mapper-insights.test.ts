import {
  insightFromPersistedContent,
  insightPersistContent,
  normalizeInsight,
  SUPABASE_INSIGHT_COMPAT_CATEGORY,
  SUPABASE_INSIGHT_COMPAT_TITLE,
} from '@/domain/insight';
import { mapTripRow, tripToCreatePayload, type DbTripRow } from '@/repositories/trips/mappers/trip-mapper';
import { normalizeTrip } from '@/domain/trip-compatibility';

function createMinimalDbTripRow(overrides: Partial<DbTripRow> = {}): DbTripRow {
  return {
    id: 'trip-supabase-insights',
    user_id: 'user-1',
    title: 'Oslo',
    destination: 'Oslo',
    country: 'Norway',
    start_date: '2026-07-01',
    end_date: '2026-07-10',
    accommodation: 'hotel',
    laundry: 'yes',
    note: '',
    types: null,
    activities: ['Vacation'],
    generated: true,
    status: 'upcoming',
    image: null,
    trip_insights: [],
    ...overrides,
  };
}

describe('trip mapper insight compatibility', () => {
  it('persists structured insight body only and reloads with compatibility category/title defaults', () => {
    const structured = normalizeInsight({
      id: 'insight-weather-rain',
      category: 'weather',
      title: 'Rain expected',
      body: 'Rain is expected on several days, so PackingWiz included rain protection.',
    });

    const trip = normalizeTrip({
      id: 'trip-supabase-insights',
      title: 'Oslo',
      destination: {
        displayName: 'Oslo',
        countryName: 'Norway',
      },
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      tripContext: ['Vacation'],
      accommodation: 'hotel',
      laundry: 'yes',
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
      bags: [],
      note: '',
      weather: {
        mode: 'climate',
        summary: 'Mild',
        detail: '',
        high: 20,
        low: 10,
      },
      items: [],
      insights: [structured],
      packingMode: 'generated',
      generated: true,
      status: 'upcoming',
    });

    const payload = tripToCreatePayload(trip);
    expect(payload.insights).toEqual([insightPersistContent(structured)]);

    const row = createMinimalDbTripRow({
      trip_insights: [
        {
          id: 'db-insight-rain',
          trip_id: trip.id,
          content: insightPersistContent(structured),
          sort_order: 0,
        },
      ],
    });

    const reloaded = mapTripRow(row);
    expect(reloaded.insights).toEqual([
      insightFromPersistedContent('db-insight-rain', insightPersistContent(structured)),
    ]);
    expect(reloaded.insights[0].category).toBe(SUPABASE_INSIGHT_COMPAT_CATEGORY);
    expect(reloaded.insights[0].title).toBe(SUPABASE_INSIGHT_COMPAT_TITLE);
    expect(reloaded.insights[0].id).toBe('db-insight-rain');
  });

  it('reloads the same Supabase insight rows deterministically without duplication', () => {
    const row = createMinimalDbTripRow({
      trip_insights: [
        {
          id: 'db-insight-1',
          trip_id: 'trip-supabase-insights',
          content: 'Laundry reasoning body',
          sort_order: 0,
        },
      ],
    });

    const first = mapTripRow(row);
    const second = mapTripRow(row);

    expect(first.insights).toEqual(second.insights);
    expect(first.insights).toHaveLength(1);
  });
});
