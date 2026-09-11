import {
  normalizePackingCategory,
  PACKING_CATEGORY_ORDER,
  type PackingCategory,
} from '@/domain/packing-item';
import { createDestinationFromText } from '@/domain/destination';
import { createDefaultSelfProfile } from '@/domain/trip-draft-profiles';
import { buildMockPackingList } from '@/mocks/mock-packing-generator-logic';

describe('normalizePackingCategory', () => {
  it.each(PACKING_CATEGORY_ORDER)('preserves known category %s', (category) => {
    expect(normalizePackingCategory(category)).toBe(category);
  });

  it('maps unknown persisted strings to Uncategorized', () => {
    expect(normalizePackingCategory('LegacyBucket')).toBe('Uncategorized');
    expect(normalizePackingCategory('')).toBe('Uncategorized');
  });

  it('preserves Important via category string', () => {
    expect(normalizePackingCategory('Important')).toBe('Important');
  });

  it('preserves Important via important source even when category string is unknown', () => {
    expect(
      normalizePackingCategory('LegacyBucket', { source: 'important', importantItemId: 'imp-1' }),
    ).toBe('Important');
  });

  it('preserves Important via importantItemId even when category string is unknown', () => {
    expect(normalizePackingCategory('LegacyBucket', { importantItemId: 'imp-1' })).toBe('Important');
  });
});

describe('generated packing regression', () => {
  it('keeps semantic Essentials in mock generator output', () => {
    const profile = createDefaultSelfProfile();
    const items = buildMockPackingList(
      {
        id: 'draft-test',
        destination: createDestinationFromText('Oslo', 'Norway'),
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        tripContext: [],
        accommodation: 'hotel',
        laundry: 'no',
        note: '',
        packingProfiles: [profile],
        travelers: [],
        bags: [],
      },
      profile,
    );

    expect(items.some((item) => item.name === 'Passport' && item.category === 'Essentials')).toBe(true);
    expect(items.some((item) => item.category === 'Uncategorized')).toBe(false);
  });
});

describe('PACKING_CATEGORY_ORDER', () => {
  it('places Uncategorized after Important and before Essentials', () => {
    const categories = PACKING_CATEGORY_ORDER as readonly PackingCategory[];
    expect(categories.indexOf('Important')).toBeLessThan(categories.indexOf('Uncategorized'));
    expect(categories.indexOf('Uncategorized')).toBeLessThan(categories.indexOf('Essentials'));
  });
});
