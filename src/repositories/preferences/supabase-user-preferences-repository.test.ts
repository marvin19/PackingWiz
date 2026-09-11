import { SupabaseUserPreferencesRepository } from '@/repositories/preferences/supabase-user-preferences-repository';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function createSupabaseClientMock(options: {
  userId?: string | null;
  authError?: string;
  row?: { smart_quantities: boolean; metric_units: boolean } | null;
  loadError?: string;
  saveError?: string;
}) {
  const upsert = jest.fn(async () => ({ error: options.saveError ? { message: options.saveError } : null }));
  const maybeSingle = jest.fn(async () => ({
    data: options.row ?? null,
    error: options.loadError ? { message: options.loadError } : null,
  }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn((table: string) => {
    if (table !== 'user_preferences') {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      select,
      upsert,
    };
  });

  const client = {
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: options.userId === null ? null : { id: options.userId ?? USER_ID } },
        error: options.authError ? { message: options.authError } : null,
      })),
    },
    from,
  };

  return { client, from, upsert, maybeSingle };
}

describe('SupabaseUserPreferencesRepository', () => {
  it('returns defaults when no row exists for the current user', async () => {
    const { client } = createSupabaseClientMock({ row: null });
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await expect(repository.load()).resolves.toEqual({
      smartQuantities: true,
      metricUnits: true,
    });
  });

  it('loads persisted preferences for the authenticated user', async () => {
    const { client } = createSupabaseClientMock({
      row: { smart_quantities: false, metric_units: false },
    });
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await expect(repository.load()).resolves.toEqual({
      smartQuantities: false,
      metricUnits: false,
    });
  });

  it('upserts preferences scoped to auth user id', async () => {
    const { client, upsert } = createSupabaseClientMock({});
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await repository.save({ smartQuantities: false, metricUnits: true });

    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: USER_ID,
        smart_quantities: false,
        metric_units: true,
      },
      { onConflict: 'user_id' },
    );
  });

  it('propagates load errors', async () => {
    const { client } = createSupabaseClientMock({ loadError: 'permission denied' });
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await expect(repository.load()).rejects.toThrow('permission denied');
  });

  it('propagates save errors', async () => {
    const { client } = createSupabaseClientMock({ saveError: 'write failed' });
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await expect(repository.save({ smartQuantities: true, metricUnits: false })).rejects.toThrow(
      'write failed',
    );
  });

  it('rejects when auth user is missing', async () => {
    const { client } = createSupabaseClientMock({ userId: null });
    const repository = new SupabaseUserPreferencesRepository(client as never);

    await expect(repository.load()).rejects.toThrow('Not authenticated');
  });
});
