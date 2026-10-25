import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import {
  createDefaultSelfProfile,
  DRAFT_PROFILE_AGE_INVALID_MESSAGE,
  DRAFT_PROFILE_AGE_REQUIRED_MESSAGE,
} from '@/domain/trip-draft-profiles';
import { AddPackingProfileSheet } from '@/features/trip-creation/components/add-packing-profile-sheet';
import {
  ADD_PERSON_DUPLICATE_NAME_MESSAGE,
  ADD_PERSON_NAME_REQUIRED_MESSAGE,
  ADD_PERSON_REQUIRED_FIELDS_LEGEND,
} from '@/features/trip-creation/components/add-packing-profile-sheet.copy';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

function renderSheet(
  props: Partial<React.ComponentProps<typeof AddPackingProfileSheet>> = {},
) {
  const onAdd = jest.fn();
  const onClose = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;

  act(() => {
    tree = TestRenderer.create(
      <AddPackingProfileSheet
        visible
        existingProfiles={[createDefaultSelfProfile()]}
        onAdd={onAdd}
        onClose={onClose}
        {...props}
      />,
    );
  });

  return { tree, onAdd, onClose };
}

describe('AddPackingProfileSheet', () => {
  it('shows required field legend and required label semantics', () => {
    const { tree } = renderSheet();

    expect(tree.root.findByProps({ children: ADD_PERSON_REQUIRED_FIELDS_LEGEND })).toBeTruthy();
    expect(tree.root.findAllByProps({ accessibilityLabel: 'Name, required' }).length).toBeGreaterThan(0);
    expect(tree.root.findAllByProps({ accessibilityLabel: 'Age, required' }).length).toBeGreaterThan(0);
  });

  it('marks name and age inputs as required for screen readers', () => {
    const { tree } = renderSheet();

    expect(
      tree.root.findByProps({ accessibilityLabel: 'Person name, required' }),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' }),
    ).toBeTruthy();
  });

  it('shows name required after blur when empty', () => {
    const { tree } = renderSheet();

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Person name, required' }).props.onBlur();
    });

    expect(tree.root.findByProps({ children: ADD_PERSON_NAME_REQUIRED_MESSAGE })).toBeTruthy();
    expect(
      tree.root.findByProps({ accessibilityHint: ADD_PERSON_NAME_REQUIRED_MESSAGE }),
    ).toBeTruthy();
  });

  it('shows duplicate name when name matches an existing profile', () => {
    const { tree } = renderSheet({
      existingProfiles: [createDefaultSelfProfile(), { id: 'p-2', name: 'Emilie', isSelf: false, age: 8 }],
    });
    const nameInput = tree.root.findByProps({ accessibilityLabel: 'Person name, required' });

    act(() => {
      nameInput.props.onChangeText('Emilie');
      nameInput.props.onBlur();
    });

    expect(tree.root.findByProps({ children: ADD_PERSON_DUPLICATE_NAME_MESSAGE })).toBeTruthy();
  });

  it('distinguishes empty age from invalid age', () => {
    const { tree } = renderSheet();

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' }).props.onBlur();
    });

    expect(tree.root.findByProps({ children: DRAFT_PROFILE_AGE_REQUIRED_MESSAGE })).toBeTruthy();
    expect(
      tree.root.findByProps({ accessibilityHint: DRAFT_PROFILE_AGE_REQUIRED_MESSAGE }),
    ).toBeTruthy();

    act(() => {
      const ageInput = tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' });
      ageInput.props.onChangeText('abc');
      ageInput.props.onBlur();
    });

    expect(tree.root.findByProps({ children: DRAFT_PROFILE_AGE_INVALID_MESSAGE })).toBeTruthy();
  });

  it.each([
    ['0', 0],
    ['120', 120],
  ])('submits a valid boundary age %s', (ageText, age) => {
    const onAdd = jest.fn();
    const { tree } = renderSheet({ onAdd });

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Person name, required' }).props.onChangeText('Pat');
      tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' }).props.onChangeText(
        ageText,
      );
    });

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Add person' }).props.onPress();
    });

    expect(onAdd).toHaveBeenCalledWith('Pat', age, true);
  });

  it('keeps Add person disabled until name and age are valid', () => {
    const { tree } = renderSheet();
    const addButton = tree.root.findByProps({ accessibilityLabel: 'Add person' });

    expect(addButton.props.disabled).toBe(true);

    const nameInput = tree.root.findByProps({ accessibilityLabel: 'Person name, required' });
    act(() => {
      nameInput.props.onChangeText('Anna');
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'Add person' }).props.disabled).toBe(true);

    const ageInput = tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' });
    act(() => {
      ageInput.props.onChangeText('10');
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'Add person' }).props.disabled).toBe(false);
  });

  it('rejects 121 without calling onAdd', () => {
    const onAdd = jest.fn();
    const { tree } = renderSheet({ onAdd });

    const nameInput = tree.root.findByProps({ accessibilityLabel: 'Person name, required' });
    const ageInput = tree.root.findByProps({ accessibilityLabel: 'Age in whole years, required' });

    act(() => {
      nameInput.props.onChangeText('Too old');
      ageInput.props.onChangeText('121');
      ageInput.props.onBlur();
    });

    expect(tree.root.findByProps({ children: DRAFT_PROFILE_AGE_INVALID_MESSAGE })).toBeTruthy();

    const addButton = tree.root.findByProps({ accessibilityLabel: 'Add person' });
    expect(addButton.props.disabled).toBe(true);

    act(() => {
      addButton.props.onPress();
    });

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('is the shared add-person sheet for wizard, trip edit, and reuse flows', () => {
    expect(AddPackingProfileSheet.name).toBe('AddPackingProfileSheet');
  });
});
