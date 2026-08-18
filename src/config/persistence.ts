export type PersistenceMode = 'supabase' | 'mock';

export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return Boolean(url && key);
}

export function getPersistenceMode(): PersistenceMode {
  return isSupabaseConfigured() ? 'supabase' : 'mock';
}
