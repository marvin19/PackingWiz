import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { getPersistenceMode } from '@/config/persistence';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  session: Session | null;
  isAuthReady: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = getPersistenceMode();
  const supabase = mode === 'supabase' ? getSupabaseClient() : null;

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(mode === 'mock');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (sessionData.session) {
          if (mounted) {
            setSession(sessionData.session);
          }
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          throw signInError;
        }

        if (mounted) {
          setSession(signInData.session);
        }
      } catch (error) {
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        }
      } finally {
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
      session,
      isAuthReady,
      authError,
    }),
    [session, isAuthReady, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
