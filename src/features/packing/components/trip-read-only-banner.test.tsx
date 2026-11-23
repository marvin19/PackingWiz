import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  TRIP_PACK_READ_ONLY_MESSAGE,
  TripReadOnlyBanner,
} from '@/features/packing/components/trip-read-only-banner';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('TripReadOnlyBanner (PW-004E-C)', () => {
  it('keeps message and accessibility label when visible', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<TripReadOnlyBanner visible />);
    });

    const labelNodes = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === TRIP_PACK_READ_ONLY_MESSAGE,
    );
    expect(labelNodes.length).toBeGreaterThan(0);

    const textNodes = tree!.root.findAll(
      (node) =>
        typeof node.props.children === 'string' &&
        node.props.children === TRIP_PACK_READ_ONLY_MESSAGE,
    );
    expect(textNodes.length).toBeGreaterThan(0);
  });

  it('renders nothing when not visible', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<TripReadOnlyBanner visible={false} />);
    });

    expect(tree!.root.children).toHaveLength(0);
  });
});