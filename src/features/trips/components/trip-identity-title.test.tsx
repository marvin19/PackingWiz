import React from 'react';
import { StyleSheet } from 'react-native';
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

  it('renders inline composite destination without flex-collapsing subtitle styles (PW-TECH-001H-A)', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    const destinationLine = 'Tokyo & Kyoto, Japan';

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          layout="inline"
          trip={{
            name: 'Kirsebærblomstring',
            title: 'Kirsebærblomstring',
            destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
          }}
        />,
      );
    });

    const location = tree!.root.findByProps({ children: destinationLine });
    expect(location.props.color).toBe('mutedForeground');
    const locationStyle = StyleSheet.flatten(location.props.style);
    expect(locationStyle.flex).toBeUndefined();
    expect(locationStyle.flexShrink).toBe(0);
    expect(tree!.root.findByProps({ accessibilityLabel: `Kirsebærblomstring, ${destinationLine}` })).toBeTruthy();
  });

  it('keeps map-pin row subtitle flexible horizontally', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          showLocationPin
          trip={{
            name: 'Hyttetur',
            title: 'Hyttetur',
            destination: createDestinationFromText('Norefjell', 'Norway'),
          }}
        />,
      );
    });

    const location = tree!.root.findByProps({ children: 'Norefjell, Norway' });
    const locationStyle = StyleSheet.flatten(location.props.style);
    expect(locationStyle.flex).toBe(1);
  });

  it('stacked layout still renders a distinct destination subtitle', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripIdentityTitle
          layout="stacked"
          trip={{
            name: 'Cherry blossom',
            title: 'Cherry blossom',
            destination: createDestinationFromText('Tokyo & Kyoto', 'Japan'),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Tokyo & Kyoto, Japan' })).toBeTruthy();
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
