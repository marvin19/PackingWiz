import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PackFilterButton } from '@/features/packing/components/pack-filter-sheet';
import {
  packHeaderChipButtonHitSlop,
  packHeaderChipButtonStyles,
} from '@/features/packing/components/pack-header-chip-button.styles';
import { PackTripMenuButton } from '@/features/packing/components/pack-trip-menu-sheet';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  Ionicons: 'Ionicons',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

function findTripMenuButton(root: TestRenderer.ReactTestInstance) {
  return root.find((node) => node.props.accessibilityLabel === 'Trip menu');
}

function findFilterButton(root: TestRenderer.ReactTestInstance) {
  return root.find((node) => node.props.accessibilityLabel === 'Filter packing list');
}

function resolvePressableStyle(
  node: TestRenderer.ReactTestInstance,
): Record<string, unknown> {
  const styleProp = node.props.style;
  const styles = typeof styleProp === 'function' ? styleProp({ pressed: false }) : styleProp;
  const list = Array.isArray(styles) ? styles : [styles];
  return Object.assign({}, ...list.filter(Boolean));
}

describe('Pack header chip buttons (PW-004D-B)', () => {
  it('shares compact dimensions between Filter and Trip menu buttons', async () => {
    let filterTree: TestRenderer.ReactTestRenderer;
    let menuTree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      filterTree = TestRenderer.create(<PackFilterButton activeFilter="all" onPress={jest.fn()} />);
      menuTree = TestRenderer.create(<PackTripMenuButton onPress={jest.fn()} />);
    });

    const filterStyle = resolvePressableStyle(findFilterButton(filterTree!.root));
    const menuStyle = resolvePressableStyle(findTripMenuButton(menuTree!.root));
    const base = packHeaderChipButtonStyles.base;

    expect(filterStyle.minHeight).toBe(base.minHeight);
    expect(menuStyle.minHeight).toBe(base.minHeight);
    expect(filterStyle.paddingHorizontal).toBe(menuStyle.paddingHorizontal);
    expect(filterStyle.paddingVertical).toBe(menuStyle.paddingVertical);
    expect(filterStyle.borderRadius).toBe(menuStyle.borderRadius);
    expect(filterStyle.gap).toBe(menuStyle.gap);
    expect(base.minHeight).toBe(32);
  });

  it('expands touch target vertically to at least 44pt without horizontal hitSlop', async () => {
    let filterTree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      filterTree = TestRenderer.create(<PackFilterButton activeFilter="all" onPress={jest.fn()} />);
    });

    const button = findFilterButton(filterTree!.root);
    expect(button.props.hitSlop).toEqual(packHeaderChipButtonHitSlop);
    expect(packHeaderChipButtonHitSlop.top + packHeaderChipButtonHitSlop.bottom + 32).toBeGreaterThanOrEqual(
      44,
    );
    expect(packHeaderChipButtonHitSlop.left).toBe(0);
    expect(packHeaderChipButtonHitSlop.right).toBe(0);
  });
});