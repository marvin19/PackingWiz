/* eslint-disable @typescript-eslint/no-require-imports -- jest.resetModules() needs fresh module load after env mutation */
jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({ rpc: jest.fn() })),
}));

describe('createAppServices persistence wiring', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('wires MockTripRepository when Supabase persistence is not enabled', () => {
    process.env.EXPO_PUBLIC_USE_SUPABASE = 'false';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { createAppServices } = require('@/config/create-services');
    const { mockTripRepository } = require('@/repositories/trips/mock-trip-repository');
    const { SupabaseTripRepository } = require('@/repositories/trips/supabase-trip-repository');

    const services = createAppServices();
    expect(services.tripRepository).toBe(mockTripRepository);
    expect(services.tripRepository).not.toBeInstanceOf(SupabaseTripRepository);
  });

  it('wires SupabaseTripRepository when Supabase persistence is enabled', () => {
    process.env.EXPO_PUBLIC_USE_SUPABASE = 'true';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

    const { createAppServices } = require('@/config/create-services');
    const { mockTripRepository } = require('@/repositories/trips/mock-trip-repository');
    const { SupabaseTripRepository } = require('@/repositories/trips/supabase-trip-repository');

    const services = createAppServices();
    expect(services.tripRepository).toBeInstanceOf(SupabaseTripRepository);
    expect(services.tripRepository).not.toBe(mockTripRepository);
  });
});
