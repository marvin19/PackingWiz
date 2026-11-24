import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { DeleteTripPermanentlyConfirmSheet } from '@/features/trips/components/delete-trip-permanently-confirm-sheet';
import { hitSlopToMinTouchTarget } from '@/lib/compact-touch-target';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('DeleteTripPermanentlyConfirmSheet touch targets (PW-005A-B1)', () => {
  it('expands header close control hit area', async () => {
    const onCancel = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <DeleteTripPermanentlyConfirmSheet
          visible
          confirmAccessibilityLabel="Delete Summer trip permanently"
          onCancel={onCancel}
          onConfirm={jest.fn()}
        />,
      );
    });

    const closeButtons = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Cancel permanent delete',
    );
    const headerClose = closeButtons.find((node) => node.props.hitSlop != null);
    expect(headerClose).toBeDefined();
    expect(headerClose!.props.hitSlop).toEqual(hitSlopToMinTouchTarget(28));

    await act(async () => {
      headerClose!.props.onPress();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});