import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

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

  it('does not show the Trip name block for existing trip details mode', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <TripSummaryDetailsContent
          mode="existing"
          facts={baseFacts}
          editHandlers={{
            onEditDestination: jest.fn(),
          }}
        />,
      );
    });

    expect(tree!.root.findAllByProps({ title: 'Trip name' })).toHaveLength(0);
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
