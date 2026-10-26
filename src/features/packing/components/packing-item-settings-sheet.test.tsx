import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import type { PackingItem } from '@/domain/packing-item';
import { PackingItemSettingsSheet } from '@/features/packing/components/packing-item-settings-sheet';
import { PACKING_ITEM_NAME_REQUIRED_MESSAGE } from '@/features/packing/components/packing-item-name-field.copy';
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

  it('shows required item name field for regular items', () => {
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

    expect(tree!.root.findAllByProps({ accessibilityLabel: 'Item name, required' }).length).toBeGreaterThan(0);
  });

  it('blocks update and shows required feedback when name is cleared', () => {
    const updatePackingItemSettings = jest.fn(() => true);
    mockUseTrips.mockReturnValue({
      updatePackingItemSettings,
      deletePackingItem: jest.fn(),
      activeTrip: {
        travelers: [],
        packingLists: [{ id: 'list-1', items: [] }],
      },
    } as unknown as ReturnType<typeof useTrips>);

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

    const nameInput = tree!.root.findByProps({
      accessibilityLabel: 'Item name, required',
      placeholder: 'Item name',
    });

    act(() => {
      nameInput.props.onChangeText('');
      nameInput.props.onBlur();
    });

    expect(tree!.root.findByProps({ children: PACKING_ITEM_NAME_REQUIRED_MESSAGE })).toBeTruthy();

    const updateButton = tree!.root.findByProps({ accessibilityLabel: 'Update item' });
    expect(updateButton.props.disabled).toBe(true);

    act(() => {
      updateButton.props.onPress();
    });

    expect(updatePackingItemSettings).not.toHaveBeenCalled();
  });

  it('updates item name when changes are valid', () => {
    const updatePackingItemSettings = jest.fn(() => true);
    mockUseTrips.mockReturnValue({
      updatePackingItemSettings,
      deletePackingItem: jest.fn(),
      activeTrip: {
        travelers: [],
        packingLists: [{ id: 'list-1', items: [] }],
      },
    } as unknown as ReturnType<typeof useTrips>);

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

    const nameInput = tree!.root.findByProps({
      accessibilityLabel: 'Item name, required',
      placeholder: 'Item name',
    });

    act(() => {
      nameInput.props.onChangeText('Løpesko');
    });

    const updateButton = tree!.root.findByProps({ accessibilityLabel: 'Update item' });
    expect(updateButton.props.disabled).toBe(false);

    act(() => {
      updateButton.props.onPress();
    });

    expect(updatePackingItemSettings).toHaveBeenCalledWith(
      regularItem.id,
      expect.objectContaining({ name: 'Løpesko' }),
    );
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
