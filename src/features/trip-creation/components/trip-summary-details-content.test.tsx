import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { TripSummaryDetailsContent } from '@/features/trip-creation/components/trip-summary-details-content';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

const baseFacts = {
  destinationLabel: 'London',
  countryLabel: 'United Kingdom',
  startDate: '2026-07-01',
  endDate: '2026-07-07',
  tripContext: ['Festival'],
  accommodation: 'hotel' as const,
  laundry: 'yes' as const,
  packingForLabel: 'Me',
  bags: [],
  note: '',
};

describe('TripSummaryDetailsContent', () => {
  it('shows trip identity hero with location pin on create Summary', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="create"
          facts={{
            ...baseFacts,
            tripNameLabel: 'Festival in London',
            tripIdentity: {
              name: 'Festival in London',
              title: 'Festival in London',
              isTripNameUserEdited: true,
              destination: createDestinationFromText('London', 'United Kingdom'),
            },
          }}
          editHandlers={{
            onEditTripName: jest.fn(),
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ name: 'map-pin', size: 14 })).toBeTruthy();
    expect(tree!.root.findByProps({ children: 'London, United Kingdom' })).toBeTruthy();
    expect(
      tree!.root.findByProps({ accessibilityLabel: 'Festival in London, London, United Kingdom' }),
    ).toBeTruthy();
    expect(tree!.root.findAll((node) => node.props.name === 'map-pin')).toHaveLength(1);
  });

  it('shows no location pin when create identity has no subtitle', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="create"
          facts={{
            ...baseFacts,
            tripNameLabel: 'Chamonix, France',
            tripIdentity: {
              name: 'Chamonix, France',
              title: 'Chamonix, France',
              isTripNameUserEdited: true,
              destination: createDestinationFromText('Chamonix', 'France'),
            },
          }}
          editHandlers={{
            onEditTripName: jest.fn(),
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ accessibilityLabel: 'Chamonix, France' })).toBeTruthy();
    expect(tree!.root.findAll((node) => node.props.name === 'map-pin')).toHaveLength(0);
  });

  it('shows the Trip name block on create Summary when provided', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="create"
          facts={{
            ...baseFacts,
            tripNameLabel: 'Festival in London',
          }}
          editHandlers={{
            onEditTripName: jest.fn(),
            onEditDestination: jest.fn(),
            onEditTripContext: jest.fn(),
          }}
        />,
      );
    });

    expect(tree!.root.findAllByProps({ title: 'Trip name' })).toHaveLength(1);
    expect(tree!.root.findByProps({ children: 'Festival in London' })).toBeTruthy();
  });

  it('shows trip identity hero and Trip name card for existing trip details', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="existing"
          facts={{
            ...baseFacts,
            tripNameLabel: 'Hyttetur',
            tripIdentity: {
              name: 'Hyttetur',
              title: 'Hyttetur',
              destination: createDestinationFromText('Norefjell', 'Norway'),
            },
          }}
          editHandlers={{
            onEditTripName: jest.fn(),
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    expect(tree!.root.findByProps({ children: 'Hyttetur', variant: 'title' })).toBeTruthy();
    expect(tree!.root.findByProps({ children: 'Norefjell, Norway' })).toBeTruthy();
    expect(tree!.root.findByProps({ name: 'map-pin' })).toBeTruthy();
    expect(tree!.root.findAllByProps({ title: 'Trip name' })).toHaveLength(1);
    expect(tree!.root.findByProps({ accessibilityLabel: 'Hyttetur, Norefjell, Norway' })).toBeTruthy();
  });

  it('routes existing trip name edit to the shared handler', () => {
    const onEditTripName = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="existing"
          facts={{
            ...baseFacts,
            tripNameLabel: 'Sommerferie',
            tripIdentity: {
              name: 'Sommerferie',
              title: 'Sommerferie',
              destination: createDestinationFromText('Madrid'),
            },
          }}
          editHandlers={{
            onEditTripName,
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    const editButton = tree!.root.findByProps({ accessibilityLabel: 'Edit trip name' });
    act(() => {
      editButton.props.onPress();
    });

    expect(onEditTripName).toHaveBeenCalledTimes(1);
  });

  it('invokes the trip name edit handler from Summary', () => {
    const onEditTripName = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="create"
          facts={{
            ...baseFacts,
            tripNameLabel: 'London',
          }}
          editHandlers={{
            onEditTripName,
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    const editButton = tree!.root.findByProps({ accessibilityLabel: 'Edit trip name' });
    act(() => {
      editButton.props.onPress();
    });

    expect(onEditTripName).toHaveBeenCalledTimes(1);
  });
});
