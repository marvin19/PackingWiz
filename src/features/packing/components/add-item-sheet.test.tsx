import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { SELECTABLE_PACKING_CATEGORIES } from '@/domain/packing-item';
import { AddItemSheet } from '@/features/packing/components/add-item-sheet';
import { useTrips } from '@/hooks/use-trips';

const mockUseTrips = useTrips as jest.MockedFunction<typeof useTrips>;
const mockAddPackingItem = jest.fn();

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

describe('AddItemSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTrips.mockReturnValue({
      addPackingItem: mockAddPackingItem,
      activeTrip: {
        travelers: [],
        packingLists: [{ id: 'list-1', items: [] }],
      },
    } as unknown as ReturnType<typeof useTrips>);
  });

  it('does not offer Important as a selectable category', () => {
    expect(SELECTABLE_PACKING_CATEGORIES).not.toContain('Important');
    expect(SELECTABLE_PACKING_CATEGORIES).toContain('Uncategorized');
    expect(SELECTABLE_PACKING_CATEGORIES).toContain('Shoes');
  });

  it('adds manual items as Uncategorized when category is not changed', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(<AddItemSheet visible onClose={jest.fn()} />);
    });

    const textInput = tree!.root.findByProps({ placeholder: 'e.g. Reusable water bottle' });
    act(() => {
      textInput.props.onChangeText('Joggesko');
    });

    const addButton = tree!.root.findByProps({ accessibilityLabel: 'Add to list' });
    act(() => {
      addButton.props.onPress();
    });

    expect(mockAddPackingItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Joggesko',
        category: 'Uncategorized',
      }),
    );
  });
});
