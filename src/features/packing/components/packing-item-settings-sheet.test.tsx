import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import type { PackingItem } from '@/domain/packing-item';
import { PackingItemSettingsSheet } from '@/features/packing/components/packing-item-settings-sheet';
import { useTrips } from '@/hooks/use-trips';

const mockUseTrips = useTrips as jest.MockedFunction<typeof useTrips>;

jest.mock('@/hooks/use-trips', () => ({
  useTrips: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const regularItem: PackingItem = {
  id: 'item-regular',
  name: 'Joggesko',
  quantity: 1,
  category: 'Uncategorized',
  packed: false,
  needToBuy: false,
  assignedTo: null,
  source: 'generated',
};

const importantItem: PackingItem = {
  id: 'item-important',
  name: 'Ørepropper',
  quantity: 1,
  category: 'Important',
  packed: false,
  needToBuy: false,
  assignedTo: null,
  source: 'important',
  importantItemId: 'imp-earplugs',
};

function findByAccessibilityLabel(root: TestRenderer.ReactTestInstance, label: string) {
  return root.findAll(
    (node) =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel === label,
  );
}

describe('PackingItemSettingsSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTrips.mockReturnValue({
      updatePackingItemSettings: jest.fn(() => true),
      deletePackingItem: jest.fn(),
      activeTrip: {
        travelers: [],
        packingLists: [{ id: 'list-1', items: [] }],
      },
    } as unknown as ReturnType<typeof useTrips>);
  });

  it('renders quantity controls for regular items', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <PackingItemSettingsSheet
          item={regularItem}
          travelers={[]}
          visible
          onClose={jest.fn()}
        />,
      );
    });

    expect(findByAccessibilityLabel(tree!.root, 'Increase quantity of Joggesko').length).toBeGreaterThan(0);
    expect(findByAccessibilityLabel(tree!.root, 'Decrease quantity of Joggesko').length).toBeGreaterThan(0);
  });

  it('does not render quantity controls for Important items', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <PackingItemSettingsSheet
          item={importantItem}
          travelers={[]}
          visible
          onClose={jest.fn()}
        />,
      );
    });

    expect(findByAccessibilityLabel(tree!.root, 'Increase quantity of Ørepropper')).toHaveLength(0);
    expect(findByAccessibilityLabel(tree!.root, 'Decrease quantity of Ørepropper')).toHaveLength(0);
  });
});
