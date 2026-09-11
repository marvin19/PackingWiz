import { MockUserPreferencesRepository } from '@/repositories/preferences/mock-user-preferences-repository';

describe('MockUserPreferencesRepository', () => {
  it('returns defaults when nothing was saved', async () => {
    const repository = new MockUserPreferencesRepository();

    await expect(repository.load()).resolves.toEqual({
      smartQuantities: true,
      metricUnits: true,
    });
  });

  it('round-trips saved preferences', async () => {
    const repository = new MockUserPreferencesRepository();

    await repository.save({ smartQuantities: false, metricUnits: false });
    await expect(repository.load()).resolves.toEqual({
      smartQuantities: false,
      metricUnits: false,
    });
  });
});
