/**
 * Trip-level packing reasoning shown on Insights — not user-provided trip facts.
 * Snapshotted at trip assembly; not recomputed when Trip Details change (v1).
 *
 * Legacy compatibility:
 * - `string[]` insights normalize to structured records with stable content-derived ids.
 * - Structured `Insight` objects keep their existing ids on normalization.
 *
 * Supabase compatibility (temporary until schema stores category/title):
 * - Persist: body only via `insightPersistContent`.
 * - Reload: `insightFromPersistedContent(dbId, content)` → category/title compatibility defaults.
 * - Mock/session structured insights are not round-tripped through Supabase unless saved.
 */

export type InsightCategory =
  | 'weather'
  | 'laundry'
  | 'trip-context'
  | 'special-consideration';

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  body: string;
}

export type InsightLike = Insight | string;

/** Compatibility defaults when reloading insights from Supabase content-only rows. */
export const SUPABASE_INSIGHT_COMPAT_CATEGORY: InsightCategory = 'special-consideration';
export const SUPABASE_INSIGHT_COMPAT_TITLE = 'Packing insight';

export function insightDisplayText(insight: Insight): string {
  return insight.body;
}

/** Persisted shape for Supabase RPC (`trip_insights.content`). */
export function insightPersistContent(insight: Insight): string {
  return insight.body;
}

/** Stable legacy id derived from normalized body text — not array index or random UUID. */
export function legacyInsightIdFromBody(body: string): string {
  const normalized = body.trim().toLowerCase();
  let hash = 5381;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(index);
  }

  return `legacy-insight-${(hash >>> 0).toString(36)}`;
}

function insightFromLegacyString(text: string): Insight {
  const trimmed = text.trim();

  return {
    id: legacyInsightIdFromBody(trimmed),
    category: 'special-consideration',
    title: 'Packing insight',
    body: trimmed,
  };
}

/** Map a Supabase `trip_insights` row after content-only persistence. */
export function insightFromPersistedContent(persistedId: string, content: string): Insight {
  return {
    id: persistedId,
    category: SUPABASE_INSIGHT_COMPAT_CATEGORY,
    title: SUPABASE_INSIGHT_COMPAT_TITLE,
    body: content.trim(),
  };
}

export function normalizeInsight(value: InsightLike): Insight {
  if (typeof value === 'string') {
    return insightFromLegacyString(value);
  }

  return {
    id: value.id,
    category: value.category,
    title: value.title,
    body: value.body.trim(),
  };
}

export function normalizeInsights(values: readonly InsightLike[] | undefined): Insight[] {
  if (!values || values.length === 0) {
    return [];
  }

  return values.map((value) => normalizeInsight(value));
}

export function cloneInsight(insight: Insight): Insight {
  return { ...insight };
}

/** Preserve first occurrence by id and by normalized body text. */
export function dedupeInsights(insights: readonly InsightLike[]): Insight[] {
  const normalized = normalizeInsights(insights);
  const seenIds = new Set<string>();
  const seenBodies = new Set<string>();
  const result: Insight[] = [];

  for (const insight of normalized) {
    const bodyKey = insight.body.trim().toLowerCase();

    if (seenIds.has(insight.id) || seenBodies.has(bodyKey)) {
      continue;
    }

    seenIds.add(insight.id);
    seenBodies.add(bodyKey);
    result.push(insight);
  }

  return result;
}

export function insightsEqual(left: readonly InsightLike[], right: readonly InsightLike[]): boolean {
  const normalizedLeft = dedupeInsights(left);
  const normalizedRight = dedupeInsights(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((insight, index) => {
    const other = normalizedRight[index];
    return (
      insight.id === other.id &&
      insight.category === other.category &&
      insight.title === other.title &&
      insight.body === other.body
    );
  });
}
