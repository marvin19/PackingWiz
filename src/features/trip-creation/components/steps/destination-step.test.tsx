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

jest.mock('@/components/ui/date-field', () => ({
  DateField: 'DateField',
}));

describe('DestinationStep', () => {
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
