/** @type {import('jest').Config} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jestConfig = require('../../jest.config.js');

describe('Jest path aliases', () => {
  it('maps @/assets before the generic @/ alias', () => {
    const entries = Object.entries(jestConfig.moduleNameMapper ?? {});
    const assetsIndex = entries.findIndex(([pattern]) => pattern.includes('assets'));
    const genericIndex = entries.findIndex(([pattern]) => pattern === '^@/(.*)$');

    expect(assetsIndex).toBeGreaterThanOrEqual(0);
    expect(genericIndex).toBeGreaterThanOrEqual(0);
    expect(assetsIndex).toBeLessThan(genericIndex);
  });

  it('resolves @/assets to the project assets root', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fixture = require('@/assets/jest-alias-fixture.js');

    expect(fixture.ok).toBe(true);
  });

  it('resolves @/ to src modules', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stats = require('@/domain/packing-stats');

    expect(typeof stats.packingStatsForTrip).toBe('function');
  });
});
