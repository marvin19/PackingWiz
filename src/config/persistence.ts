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

export interface PersistenceDiagnostics {
  mode: PersistenceMode;
  /** True when EXPO_PUBLIC_USE_SUPABASE is exactly the string "true". */
  supabaseFlagEnabled: boolean;
  /** True when URL + publishable key env vars are non-empty. */
  supabaseConfigured: boolean;
  tripRepositoryKind: 'supabase' | 'mock';
}

/** Dev-safe snapshot of runtime persistence wiring — never includes secrets. */
export function getPersistenceDiagnostics(): PersistenceDiagnostics {
  const supabaseFlagEnabled = isSupabasePersistenceEnabled();
  const supabaseConfigured = isSupabaseConfigured();
  const mode = getPersistenceMode();

  return {
    mode,
    supabaseFlagEnabled,
    supabaseConfigured,
    tripRepositoryKind: mode === 'supabase' ? 'supabase' : 'mock',
  };
}

/** One-line dev console diagnostic so mock vs Supabase mode is unambiguous at runtime. */
export function logPersistenceDiagnosticsDev(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const diagnostics = getPersistenceDiagnostics();
  console.info(
    `[PackingWiz] persistence mode=${diagnostics.mode} tripRepository=${diagnostics.tripRepositoryKind}`,
    `(EXPO_PUBLIC_USE_SUPABASE=${diagnostics.supabaseFlagEnabled}, credentials=${diagnostics.supabaseConfigured})`,
  );

  if (diagnostics.mode === 'mock' && diagnostics.supabaseConfigured) {
    console.warn(
      '[PackingWiz] Supabase credentials are set but EXPO_PUBLIC_USE_SUPABASE is not exactly "true". Using MockTripRepository — trips are in-memory only and will not survive refresh or appear in Supabase.',
    );
  }
}

export interface SavedProfilesDiagnostics {
  mode: PersistenceMode;
  count: number;
  profiles: { id: string; name: string }[];
}

/** Dev-only snapshot of loaded reusable packing profiles (ids + names only). */
export function buildSavedProfilesDiagnostics(
  profiles: { id: string; name: string; isSelf?: boolean }[],
): SavedProfilesDiagnostics {
  const reusable = profiles.filter((profile) => !profile.isSelf);

  return {
    mode: getPersistenceMode(),
    count: reusable.length,
    profiles: reusable.map((profile) => ({ id: profile.id, name: profile.name })),
  };
}

export function logSavedProfilesDiagnosticsDev(
  profiles: { id: string; name: string; isSelf?: boolean }[],
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const diagnostics = buildSavedProfilesDiagnostics(profiles);
  console.info(
    `[PackingWiz] saved packing profiles mode=${diagnostics.mode} count=${diagnostics.count}`,
    diagnostics.profiles,
  );
}
