export type PersistenceMode = 'supabase' | 'mock';

/**
 * Mock mode keeps trips in an in-memory repository for the current session only.
 * A full browser/app reload re-seeds from mock data — custom trips and activeTripId
 * are not restored until real persistence (Supabase) is enabled in a later phase.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return Boolean(url && key);
}

/** Supabase persistence is opt-in; mock remains the default development mode. */
export function isSupabasePersistenceEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_SUPABASE?.trim() === 'true';
}

export function getPersistenceMode(): PersistenceMode {
  if (isSupabasePersistenceEnabled() && isSupabaseConfigured()) {
    return 'supabase';
  }

  return 'mock';
}
