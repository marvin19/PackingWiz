import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { applyTripDraftPatch } from '@/domain/trip-draft-naming';
import { DestinationStep } from '@/features/trip-creation/components/steps/destination-step';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('@/components/ui/date-field', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const { AppText } = jest.requireActual<typeof import('@/components/ui/app-text')>(
    '@/components/ui/app-text',
  );

  return {
    DateField: ({ label, required }: { label: string; required?: boolean }) =>
      React.createElement(
        View,
        { accessibilityLabel: required ? `${label}, required` : label },
        React.createElement(AppText, null, label),
      ),
  };
});

describe('DestinationStep', () => {
  it('marks destination and dates as required in the creation wizard', () => {
    const draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Oslo', 'Norway'),
    });

    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <DestinationStep draft={draft} onChange={jest.fn()} onChangeName={jest.fn()} />,
      );
    });

    expect(tree!.root.findAllByProps({ accessibilityLabel: 'Destination, required' }).length).toBeGreaterThan(0);
    expect(tree!.root.findAllByProps({ children: '* Required fields' })).toHaveLength(0);
    expect(tree!.root.findByProps({ accessibilityLabel: 'Departure, required' })).toBeTruthy();
    expect(tree!.root.findByProps({ accessibilityLabel: 'Return, required' })).toBeTruthy();
    expect(
      tree!.root.findByProps({ accessibilityLabel: 'Destination, required', placeholder: 'Search a city or country' }),
    ).toBeTruthy();
  });

  it('includes optional trip name between destination and dates', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Oslo', 'Norway'),
      startDate: '2027-06-01',
      endDate: '2027-06-10',
    });

    const onChangeName = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      tree = TestRenderer.create(
        <DestinationStep draft={draft} onChange={jest.fn()} onChangeName={onChangeName} />,
      );
    });

    expect(tree!.root.findByProps({ label: 'Trip name (optional)' })).toBeTruthy();
    expect(
      tree!.root.findByProps({
        children: 'e.g. Hyttetur. Leave blank to use destination.',
      }),
    ).toBeTruthy();

    const nameInput = tree!.root.findByProps({ accessibilityLabel: 'Trip name' });
    act(() => {
      nameInput.props.onChangeText('Hyttetur');
    });

    expect(onChangeName).toHaveBeenCalledWith('Hyttetur');
  });
});
