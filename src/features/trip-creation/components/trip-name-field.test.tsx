import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { createEmptyTripDraft } from '@/domain/trip-draft';
import { applyTripDraftPatch } from '@/domain/trip-draft-naming';
import {
  TRIP_NAME_FIELD_HELPER_TEXT,
  tripNameFieldDisplayValue,
  TripNameField,
} from '@/features/trip-creation/components/trip-name-field';

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('tripNameFieldDisplayValue', () => {
  it('shows an empty field while the name still follows the destination default', () => {
    const draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
    });

    expect(draft.name).toBe('Barcelona');
    expect(tripNameFieldDisplayValue(draft)).toBe('');
  });

  it('shows the raw draft name after the user edits', () => {
    const draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Barcelona', 'Spain'),
      name: 'Festival in Barcelona ',
      isTripNameUserEdited: true,
    });

    expect(tripNameFieldDisplayValue(draft)).toBe('Festival in Barcelona ');
  });
});

describe('TripNameField', () => {
  it('shows compact default helper text with example and blank-field guidance', () => {
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Madrid'),
    });

    let tree: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      tree = TestRenderer.create(
        <TripNameField draft={draft} onChangeName={jest.fn()} label="Trip name (optional)" />,
      );
    });

    expect(tree!.root.findByProps({ children: TRIP_NAME_FIELD_HELPER_TEXT })).toBeTruthy();
    expect(tree!.root.findByProps({ placeholder: 'Trip name' })).toBeTruthy();
    expect(
      tree!.root.findByProps({
        accessibilityHint: TRIP_NAME_FIELD_HELPER_TEXT,
      }),
    ).toBeTruthy();
  });

  it('forwards name edits to the parent handler', () => {
    const onChangeName = jest.fn();
    let draft = applyTripDraftPatch(createEmptyTripDraft('draft-1'), {
      destination: createDestinationFromText('Madrid'),
    });

    let tree: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      tree = TestRenderer.create(
        <TripNameField draft={draft} onChangeName={onChangeName} label="Trip name (optional)" />,
      );
    });

    const input = tree!.root.findByProps({ accessibilityLabel: 'Trip name' });
    act(() => {
      input.props.onChangeText('Sommerferie');
    });

    expect(onChangeName).toHaveBeenCalledWith('Sommerferie');
  });
});
