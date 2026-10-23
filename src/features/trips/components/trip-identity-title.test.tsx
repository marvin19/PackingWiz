import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { TripIdentityTitle } from '@/features/trips/components/trip-identity-title';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('TripIdentityTitle', () => {
  it('shows custom trip name with secondary destination line', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          trip={{
            name: 'Sommerferie 2027',
            title: 'Sommerferie 2027',
            destination: createDestinationFromText('Madrid'),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Sommerferie 2027' })).toBeTruthy();
    expect(tree!.root.findByProps({ children: 'Madrid' })).toBeTruthy();
    expect(tree!.root.findByProps({ accessibilityLabel: 'Sommerferie 2027, Madrid' })).toBeTruthy();
  });

  it('omits secondary line when it would repeat the trip name', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          trip={{
            name: 'Madrid',
            title: 'Madrid',
            destination: createDestinationFromText('Madrid'),
          }}
        />,
      );
    });

    const titleNodes = tree!.root.findAll(
      (node) => node.props.children === 'Madrid' && node.props.variant === 'title',
    );
    expect(titleNodes).toHaveLength(1);
    expect(tree!.root.findByProps({ accessibilityLabel: 'Madrid' })).toBeTruthy();
  });

  it('uses compact inline typography with two-line wrap beside constrained header chrome', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    const longName =
      'Family summer cabin trip with grandparents and cousins across two weeks';

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          layout="inline"
          trip={{
            name: longName,
            title: longName,
            destination: createDestinationFromText('Norefjell', 'Norway'),
          }}
        />,
      );
    });

    const title = tree!.root.findByProps({ children: longName });
    expect(title.props.variant).toBe('subheading');
    expect(title.props.numberOfLines).toBe(2);
    expect(title.props.maxFontSizeMultiplier).toBe(1.25);
    expect(tree!.root.findByProps({ accessibilityLabel: `${longName}, Norefjell, Norway` })).toBeTruthy();
  });

  it('allows stacked layout to wrap long titles up to three lines', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    const longName = 'Annual company offsite and team-building retreat in the mountains';

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          layout="stacked"
          trip={{
            name: longName,
            title: longName,
            destination: createDestinationFromText('Lisbon', 'Portugal'),
          }}
        />,
      );
    });

    const title = tree!.root.findByProps({ children: longName });
    expect(title.props.variant).toBe('title');
    expect(title.props.numberOfLines).toBe(3);
  });

  it('does not render a location row when destination is empty', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          trip={{
            name: 'Mystery trip',
            title: 'Mystery trip',
            destination: createDestinationFromText(''),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Mystery trip' })).toBeTruthy();
    expect(tree!.root.findByProps({ accessibilityLabel: 'Mystery trip' })).toBeTruthy();
    expect(tree!.root.findAllByProps({ color: 'mutedForeground' })).toHaveLength(0);
  });
});
