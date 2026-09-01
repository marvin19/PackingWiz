import {
  cloneInsight,
  dedupeInsights,
  insightDisplayText,
  insightFromPersistedContent,
  insightPersistContent,
  legacyInsightIdFromBody,
  normalizeInsight,
  normalizeInsights,
  SUPABASE_INSIGHT_COMPAT_CATEGORY,
  SUPABASE_INSIGHT_COMPAT_TITLE,
} from '@/domain/insight';

describe('insight normalization', () => {
  it('converts legacy string insights into structured records', () => {
    const normalized = normalizeInsights(['Bring sunscreen', 'Pack light']);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].body).toBe('Bring sunscreen');
    expect(normalized[0].category).toBe('special-consideration');
    expect(normalized[0].id).toBe(legacyInsightIdFromBody('Bring sunscreen'));
    expect(normalized[1].id).toBe(legacyInsightIdFromBody('Pack light'));
  });

  it('assigns the same stable legacy id for the same string across repeated normalization', () => {
    const first = normalizeInsight('Shared laundry tip');
    const second = normalizeInsight('Shared laundry tip');
    const batch = normalizeInsights(['Shared laundry tip']);

    expect(first.id).toBe(second.id);
    expect(batch[0].id).toBe(first.id);
    expect(first.id).toBe(legacyInsightIdFromBody('Shared laundry tip'));
  });

  it('preserves structured insight ids and fields on normalization', () => {
    const structured = {
      id: 'insight-weather-rain',
      category: 'weather' as const,
      title: 'Rain expected',
      body: 'Rain is expected on several days, so PackingWiz included rain protection.',
    };

    expect(normalizeInsight(structured)).toEqual(structured);
    expect(normalizeInsights([structured])[0].id).toBe('insight-weather-rain');
  });

  it('dedupes duplicate legacy strings deterministically while preserving first occurrence order', () => {
    const first = normalizeInsight('Shared laundry tip');

    expect(dedupeInsights(['Shared laundry tip', 'Another tip', 'Shared laundry tip'])).toEqual([
      first,
      normalizeInsight('Another tip'),
    ]);
  });

  it('dedupes by id and body text while preserving first occurrence', () => {
    const first = normalizeInsight('Shared laundry tip');
    const duplicateBody = { ...first, id: 'duplicate-id' };

    expect(dedupeInsights([first, duplicateBody, 'Shared laundry tip'])).toEqual([first]);
  });

  it('keeps legacy insight ordering stable across repeated normalization', () => {
    const source = ['First tip', 'Second tip', 'Third tip'];

    expect(normalizeInsights(source)).toEqual(normalizeInsights(source));
    expect(normalizeInsights(source).map((insight) => insight.id)).toEqual(
      normalizeInsights(source).map((insight) => insight.id),
    );
  });

  it('clones insight records without sharing references', () => {
    const source = normalizeInsight('Existing insight');
    const cloned = cloneInsight(source);

    expect(cloned).toEqual(source);
    expect(cloned).not.toBe(source);
  });

  it('uses body text for current display surfaces', () => {
    expect(
      insightDisplayText({
        id: 'insight-weather-rain',
        category: 'weather',
        title: 'Rain expected',
        body: 'Rain is expected on several days, so PackingWiz included rain protection.',
      }),
    ).toBe('Rain is expected on several days, so PackingWiz included rain protection.');
  });

  it('maps persisted Supabase content-only rows to compatibility structured insights', () => {
    const reloaded = insightFromPersistedContent('db-insight-1', 'Rain protection was included.');

    expect(reloaded).toEqual({
      id: 'db-insight-1',
      category: SUPABASE_INSIGHT_COMPAT_CATEGORY,
      title: SUPABASE_INSIGHT_COMPAT_TITLE,
      body: 'Rain protection was included.',
    });
    expect(insightPersistContent(reloaded)).toBe('Rain protection was included.');
  });

  it('does not change persisted id when reloading the same Supabase row repeatedly', () => {
    const first = insightFromPersistedContent('db-insight-1', 'Same body');
    const second = insightFromPersistedContent('db-insight-1', 'Same body');

    expect(first).toEqual(second);
  });
});
