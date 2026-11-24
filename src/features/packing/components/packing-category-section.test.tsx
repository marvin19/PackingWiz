import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PackingCategoryHeader } from '@/features/packing/components/packing-category-section';
import { hitSlopToMinTouchTarget } from '@/lib/compact-touch-target';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('PackingCategoryHeader touch targets (PW-005A-B1)', () => {
  it('expands chevron control hit area', async () => {
    const onToggleCollapsed = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackingCategoryHeader
          category="Clothing"
          items={[
            {
              id: 'i-1',
              name: 'Shirt',
              quantity: 1,
              category: 'Clothing',
              packed: false,
              needToBuy: false,
              assignedTo: null,
            },
          ]}
          collapsed={false}
          onToggleCollapsed={onToggleCollapsed}
        />,
      );
    });

    const chevron = tree!.root.find((node) => node.props.accessibilityLabel === 'Collapse Clothing');
    expect(chevron.props.hitSlop).toEqual(hitSlopToMinTouchTarget(32));

    await act(async () => {
      chevron.props.onPress();
    });

    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
  });
});