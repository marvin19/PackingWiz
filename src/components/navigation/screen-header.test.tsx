import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { ScreenHeader } from '@/components/navigation/screen-header';
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

describe('ScreenHeader touch targets (PW-005A-B1)', () => {
  it('expands back and close controls to 44pt effective area', async () => {
    const onBack = jest.fn();
    const onClose = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <ScreenHeader title="Trip details" onBack={onBack} onClose={onClose} />,
      );
    });

    const expected = hitSlopToMinTouchTarget(36);
    const back = tree!.root.find((node) => node.props.accessibilityLabel === 'Go back');
    const close = tree!.root.find((node) => node.props.accessibilityLabel === 'Close');

    expect(back.props.hitSlop).toEqual(expected);
    expect(close.props.hitSlop).toEqual(expected);

    await act(async () => {
      back.props.onPress();
      close.props.onPress();
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});