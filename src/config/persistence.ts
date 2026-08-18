export type PersistenceMode = 'supabase' | 'mock';

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
