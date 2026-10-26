import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { WizardFooter } from '@/features/trip-creation/components/wizard-footer';

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('WizardFooter', () => {
  it('shows continue guidance when disabled and a hint is provided', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <WizardFooter
          label="Continue"
          disabled
          continueHint="Select at least one trip tag to continue."
          onPress={jest.fn()}
        />,
      );
    });

    expect(
      tree.root.findByProps({ children: 'Select at least one trip tag to continue.' }),
    ).toBeTruthy();
    expect(tree.root.findByProps({ accessibilityLabel: 'Continue' }).props.disabled).toBe(true);
  });

  it('hides the hint when Continue is enabled', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <WizardFooter
          label="Continue"
          disabled={false}
          continueHint="Select at least one trip tag to continue."
          onPress={jest.fn()}
        />,
      );
    });

    expect(
      tree.root.findAllByProps({ children: 'Select at least one trip tag to continue.' }),
    ).toHaveLength(0);
  });
});
