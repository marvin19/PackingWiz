/* eslint-disable @typescript-eslint/no-require-imports -- jest.resetModules() needs fresh module load after env mutation */
describe('persistence mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to mock when EXPO_PUBLIC_USE_SUPABASE is unset', () => {
    delete process.env.EXPO_PUBLIC_USE_SUPABASE;
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { getPersistenceMode, getPersistenceDiagnostics } = require('@/config/persistence');
    expect(getPersistenceMode()).toBe('mock');
    expect(getPersistenceDiagnostics().tripRepositoryKind).toBe('mock');
  });

  it('defaults to mock when EXPO_PUBLIC_USE_SUPABASE is not exactly "true"', () => {
    process.env.EXPO_PUBLIC_USE_SUPABASE = '1';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { getPersistenceMode } = require('@/config/persistence');
    expect(getPersistenceMode()).toBe('mock');
  });

  it('selects supabase when flag is true and credentials are configured', () => {
    process.env.EXPO_PUBLIC_USE_SUPABASE = 'true';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { getPersistenceMode, getPersistenceDiagnostics } = require('@/config/persistence');
    expect(getPersistenceMode()).toBe('supabase');
    expect(getPersistenceDiagnostics().tripRepositoryKind).toBe('supabase');
  });

  it('builds dev-safe saved profile diagnostics', () => {
    process.env.EXPO_PUBLIC_USE_SUPABASE = 'true';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { buildSavedProfilesDiagnostics } = require('@/config/persistence');
    const diagnostics = buildSavedProfilesDiagnostics([
      { id: 'profile-emilie', name: 'Emilie', isSelf: false },
      { id: 'self', name: 'Me', isSelf: true },
    ]);

    expect(diagnostics.mode).toBe('supabase');
    expect(diagnostics.count).toBe(1);
    expect(diagnostics.profiles).toEqual([{ id: 'profile-emilie', name: 'Emilie' }]);
  });
});
