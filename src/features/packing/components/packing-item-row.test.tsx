import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import type { PackingItem } from '@/domain/packing-item';
import { PackingItemRow } from '@/features/packing/components/packing-item-row';
import { hitSlopToMinTouchTarget } from '@/lib/compact-touch-target';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

const baseItem: PackingItem = {
  id: 'item-1',
  name: 'Rain jacket',
  quantity: 1,
  category: 'Clothing',
  packed: true,
  needToBuy: false,
  assignedTo: null,
};

describe('PackingItemRow read-only (PW-004E-B)', () => {
  it('uses static status text and hides settings when readOnly', async () => {
    const onCheckboxPress = jest.fn();
    const onOpenSettings = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackingItemRow
          item={baseItem}
          travelers={[]}
          checkboxIntent="packed"
          readOnly
          onCheckboxPress={onCheckboxPress}
          onOpenSettings={onOpenSettings}
        />,
      );
    });

    const checkboxNodes = tree!.root.findAll(
      (node) => node.props.accessibilityRole === 'checkbox',
    );
    expect(checkboxNodes).toHaveLength(0);

    const statusNode = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Rain jacket, packed',
    );
    expect(statusNode.length).toBeGreaterThan(0);

    const settingsNodes = tree!.root.findAll(
      (node) =>
        typeof node.props.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.includes('Packing item settings'),
    );
    expect(settingsNodes).toHaveLength(0);
  });

  it('applies historical row surface when readOnly', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackingItemRow
          item={{ ...baseItem, packed: false }}
          travelers={[]}
          checkboxIntent="packed"
          readOnly
          onCheckboxPress={jest.fn()}
          onOpenSettings={jest.fn()}
        />,
      );
    });

    const rowViews = tree!.root.findAll(
      (node) =>
        node.props.style &&
        [node.props.style].flat().some(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            'backgroundColor' in entry &&
            entry.backgroundColor != null,
        ),
    );
    expect(rowViews.length).toBeGreaterThan(0);
  });

  it('keeps interactive checkbox when not readOnly', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackingItemRow
          item={{ ...baseItem, packed: false }}
          travelers={[]}
          checkboxIntent="packed"
          onCheckboxPress={jest.fn()}
          onOpenSettings={jest.fn()}
        />,
      );
    });

    const checkboxNodes = tree!.root.findAll(
      (node) => node.props.accessibilityRole === 'checkbox',
    );
    expect(checkboxNodes.length).toBeGreaterThan(0);
  });
});

describe('PackingItemRow touch targets (PW-005A-B1)', () => {
  it('expands checkbox and settings hit areas without changing handlers', async () => {
    const onCheckboxPress = jest.fn();
    const onOpenSettings = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <PackingItemRow
          item={{ ...baseItem, packed: false }}
          travelers={[]}
          checkboxIntent="packed"
          onCheckboxPress={onCheckboxPress}
          onOpenSettings={onOpenSettings}
        />,
      );
    });

    const checkbox = tree!.root.find((node) => node.props.accessibilityRole === 'checkbox');
    const settings = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Packing item settings for Rain jacket',
    );

    expect(checkbox.props.hitSlop).toEqual(hitSlopToMinTouchTarget(28));
    expect(settings.props.hitSlop).toEqual(hitSlopToMinTouchTarget(32));

    await act(async () => {
      checkbox.props.onPress();
      settings.props.onPress();
    });

    expect(onCheckboxPress).toHaveBeenCalledWith('item-1');
    expect(onOpenSettings).toHaveBeenCalledWith('item-1');
  });
});