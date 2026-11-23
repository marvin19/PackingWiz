import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PackFilterButton } from '@/features/packing/components/pack-filter-sheet';
import { packHeaderChipButtonHitSlop } from '@/features/packing/components/pack-header-chip-button.styles';
import type { PackingFilter } from '@/features/packing/utils/group-items';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

function findFilterButton(root: TestRenderer.ReactTestInstance) {
  return root.find(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith('Filter packing list'),
  );
}

function resolvePressableStyle(
  node: TestRenderer.ReactTestInstance,
): Record<string, unknown> {
  const styleProp = node.props.style;
  const styles = typeof styleProp === 'function' ? styleProp({ pressed: false }) : styleProp;
  const list = Array.isArray(styles) ? styles : [styles];
  return Object.assign({}, ...list.filter(Boolean));
}

function labelText(root: TestRenderer.ReactTestInstance): string | undefined {
  const texts = root.findAll(
    (node) => typeof node.props.children === 'string' && node.props.children.includes('Filter'),
  );
  return texts.map((node) => String(node.props.children)).find((text) => text.startsWith('Filter'));
}

describe('PackFilterButton (PW-004D)', () => {
  it.each<[PackingFilter, string, string]>([
    ['all', 'Filter', 'Filter packing list'],
    ['todo', 'Filter · 1', 'Filter packing list, To pack active'],
    ['buy', 'Filter · 1', 'Filter packing list, Shopping active'],
  ])('shows label and accessibility for %s', async (activeFilter, expectedLabel, expectedA11y) => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackFilterButton activeFilter={activeFilter} onPress={jest.fn()} />,
      );
    });

    const button = findFilterButton(tree!.root);
    expect(button.props.accessibilityLabel).toBe(expectedA11y);
    expect(labelText(tree!.root)).toBe(expectedLabel);
  });

  it('applies primary border when a non-default filter is active', async () => {
    const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
    let activeTree: TestRenderer.ReactTestRenderer;
    let defaultTree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      activeTree = TestRenderer.create(<PackFilterButton activeFilter="todo" onPress={jest.fn()} />);
      defaultTree = TestRenderer.create(<PackFilterButton activeFilter="all" onPress={jest.fn()} />);
    });

    const activeStyle = resolvePressableStyle(findFilterButton(activeTree!.root));
    const defaultStyle = resolvePressableStyle(findFilterButton(defaultTree!.root));

    expect(activeStyle.borderColor).toBe(theme.colors.primary);
    expect(defaultStyle.borderColor).toBe(theme.colors.border);
    expect(activeStyle.backgroundColor).toBe(`${theme.colors.primary}14`);
    expect(defaultStyle.backgroundColor).toBe(theme.colors.muted);
  });

  it('calls onPress when activated', async () => {
    const onPress = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackFilterButton activeFilter="all" onPress={onPress} />);
    });

    await act(async () => {
      findFilterButton(tree!.root).props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses compact chip with vertical hitSlop for 44pt touch target', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<PackFilterButton activeFilter="all" onPress={jest.fn()} />);
    });

    const button = findFilterButton(tree!.root);
    const style = resolvePressableStyle(button);
    expect(style.minHeight).toBe(32);
    expect(button.props.hitSlop).toEqual(packHeaderChipButtonHitSlop);
    expect(packHeaderChipButtonHitSlop.top + packHeaderChipButtonHitSlop.bottom + 32).toBeGreaterThanOrEqual(
      44,
    );
  });
});