import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PackTripMenuSheet } from '@/features/packing/components/pack-trip-menu-sheet';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('PackTripMenuSheet', () => {
  it('omits Edit trip when allowEditTrip is false (PW-004E-B)', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackTripMenuSheet
          visible
          allowEditTrip={false}
          onSelect={jest.fn()}
          onClose={jest.fn()}
        />,
      );
    });

    const editRows = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Edit trip',
    );
    expect(editRows).toHaveLength(0);

    const insightRows = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Insights',
    );
    expect(insightRows.length).toBeGreaterThan(0);
  });

  it('does not include Filter (PW-004D-A)', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackTripMenuSheet visible allowEditTrip onSelect={jest.fn()} onClose={jest.fn()} />,
      );
    });

    const filterRows = tree!.root.findAll(
      (node) =>
        node.props.accessibilityLabel === 'Filter' ||
        (typeof node.props.accessibilityLabel === 'string' &&
          node.props.accessibilityLabel.startsWith('Filter,')),
    );
    expect(filterRows).toHaveLength(0);

    const backRows = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Back to all trips',
    );
    expect(backRows.length).toBeGreaterThan(0);
  });
});