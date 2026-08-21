import 'react-native-url-polyfill/auto';

import { AppState, Platform } from 'react-native';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured } from '@/config/persistence';

let client: SupabaseClient | null = null;
let appStateRegistered = false;

function createAuthOptions() {
  const options = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  };

  if (Platform.OS !== 'web') {
    // Lazy require keeps AsyncStorage out of web/SSR evaluation paths.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only storage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return { ...options, storage: AsyncStorage };
  }

  return options;
}

function registerNativeAutoRefresh(supabase: SupabaseClient) {
  if (Platform.OS === 'web' || appStateRegistered) {
    return;
  }

  appStateRegistered = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: createAuthOptions(),
      },
    );

    registerNativeAutoRefresh(client);
  }

  return client;
}
