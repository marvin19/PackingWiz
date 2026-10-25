import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { defaultImportantItemsConfig } from '@/domain/important-items-config';
import { ImportantProfileCard } from '@/features/trip-creation/components/important-profile-card';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('ImportantProfileCard placeholders', () => {
  it('shows child-oriented first-row placeholder and keeps accessibility labels', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ImportantProfileCard
          profile={{ id: 'p-child', name: 'Emilie', age: 8, isSelf: false }}
          config={defaultImportantItemsConfig}
          stagedRows={['']}
          expanded
          onChangeRows={jest.fn()}
          onExpand={jest.fn()}
          onConfigureLater={jest.fn()}
        />,
      );
    });

    const input = tree.root.findByProps({ accessibilityLabel: 'Important item 1 for Emilie' });
    expect(input.props.placeholder).toBe('e.g. Favourite teddy');
  });

  it('shows adult-oriented placeholder for self profile', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <ImportantProfileCard
          profile={{ id: 'draft-profile-self', name: 'Me', isSelf: true }}
          config={defaultImportantItemsConfig}
          stagedRows={['']}
          expanded
          onChangeRows={jest.fn()}
          onExpand={jest.fn()}
          onConfigureLater={jest.fn()}
        />,
      );
    });

    const input = tree.root.findByProps({ accessibilityLabel: 'Important item 1 for Me' });
    expect(input.props.placeholder).toBe('e.g. Medication');
  });
});
