import { PACKING_CATEGORY_ORDER, type PackingItem } from '@/domain/packing-item';
import { groupItemsByCategory } from '@/features/packing/utils/group-items';

function makeItem(overrides: Partial<PackingItem> & Pick<PackingItem, 'id' | 'name' | 'category'>): PackingItem {
  return {
    quantity: 1,
    packed: false,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
    ...overrides,
  };
}

describe('groupItemsByCategory', () => {
  it('renders Uncategorized items under Uncategorized', () => {
    const groups = groupItemsByCategory([
      makeItem({ id: '1', name: 'Mystery item', category: 'Uncategorized' }),
    ]);

    expect(groups).toEqual([{ category: 'Uncategorized', items: [expect.objectContaining({ id: '1' })] }]);
  });

  it('hides empty categories', () => {
    const groups = groupItemsByCategory([
      makeItem({ id: '1', name: 'Shirt', category: 'Clothing' }),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Clothing']);
    expect(groups.some((group) => group.category === 'Essentials')).toBe(false);
  });

  it('follows canonical category order', () => {
    const groups = groupItemsByCategory([
      makeItem({ id: '1', name: 'Shirt', category: 'Clothing' }),
      makeItem({ id: '2', name: 'Passport', category: 'Essentials' }),
      makeItem({ id: '3', name: 'Manual add', category: 'Uncategorized' }),
    ]);

    expect(groups.map((group) => group.category)).toEqual(['Uncategorized', 'Essentials', 'Clothing']);
    expect(groups.map((group) => group.category)).toEqual(
      [...PACKING_CATEGORY_ORDER].filter((category) =>
        ['Uncategorized', 'Essentials', 'Clothing'].includes(category),
      ),
    );
  });

  it('groups Important items under Important regardless of stored category string', () => {
    const groups = groupItemsByCategory([
      makeItem({
        id: 'imp',
        name: 'EpiPen',
        category: 'Essentials',
        source: 'important',
        importantItemId: 'imp-1',
      }),
    ]);

    expect(groups).toEqual([{ category: 'Important', items: [expect.objectContaining({ id: 'imp' })] }]);
  });

  it('removes a category when no items remain after regrouping', () => {
    const before = groupItemsByCategory([makeItem({ id: '1', name: 'Shoes', category: 'Shoes' })]);
    const after = groupItemsByCategory([makeItem({ id: '1', name: 'Shoes', category: 'Clothing' })]);

    expect(before.map((group) => group.category)).toEqual(['Shoes']);
    expect(after.map((group) => group.category)).toEqual(['Clothing']);
  });
});
