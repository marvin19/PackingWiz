import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { ImportantItemsEmptyCard } from '@/features/packing/components/important-items-empty-card';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('ImportantItemsEmptyCard', () => {
  it('shows child example copy when profile age is provided', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ImportantItemsEmptyCard
          profileLabel="Emilie"
          profile={{ isSelf: false, age: 8 }}
          onAdd={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    });

    expect(tree.root.findByProps({ children: 'Important for Emilie' })).toBeTruthy();
    expect(
      tree.root.findByProps({
        children: 'e.g. favourite teddy, comfort blanket, medication',
      }),
    ).toBeTruthy();
    expect(tree.root.findByProps({ accessibilityLabel: 'Add important items' })).toBeTruthy();
  });
});
