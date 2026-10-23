import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { AuthProvider, useAuth } from '@/providers/auth-provider';

const mockGetSession = jest.fn();
const mockSignInAnonymously = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

jest.mock('@/config/persistence', () => ({
  getPersistenceMode: jest.fn(() => 'supabase' as const),
}));

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
      signInAnonymously: mockSignInAnonymously,
      onAuthStateChange: mockOnAuthStateChange,
    },
  })),
}));

function AuthProbe({ onReady }: { onReady: (value: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  React.useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);
  return null;
}

describe('AuthProvider anonymous session lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignInAnonymously.mockResolvedValue({
      data: { session: { user: { id: 'anon-user-id' } } },
      error: null,
    });
  });

  it('restores an existing session without creating a new anonymous user', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'existing-user-id' } } },
      error: null,
    });

    const authValue: { current: ReturnType<typeof useAuth> | null } = { current: null };

    await act(async () => {
      TestRenderer.create(
        <AuthProvider>
          <AuthProbe onReady={(value) => { authValue.current = value; }} />
        </AuthProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockSignInAnonymously).not.toHaveBeenCalled();
    expect(authValue.current?.userId).toBe('existing-user-id');
    expect(authValue.current?.isAuthReady).toBe(true);
  });

  it('creates an anonymous session only when no stored session exists', async () => {
    const authValue: { current: ReturnType<typeof useAuth> | null } = { current: null };

    await act(async () => {
      TestRenderer.create(
        <AuthProvider>
          <AuthProbe onReady={(value) => { authValue.current = value; }} />
        </AuthProvider>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockSignInAnonymously).toHaveBeenCalled();
    expect(authValue.current?.userId).toBe('anon-user-id');
    expect(authValue.current?.isAuthReady).toBe(true);
  });
});
