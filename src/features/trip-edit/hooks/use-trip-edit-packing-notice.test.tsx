import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useTripEditPackingNotice } from '@/features/trip-edit/hooks/use-trip-edit-packing-notice';
import {
  resetTripEditSaveNoticeHandoffForTests,
  stageTripEditPackingNotice,
} from '@/features/trip-edit/utils/trip-edit-save-notice-handoff';

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory scope
    const { useEffect } = require('react');
    useEffect(() => {
      const cleanup = effect();
      return cleanup;
    }, [effect]);
  },
}));

function PackingNoticeProbe() {
  const show = useTripEditPackingNotice();
  return show ? <>{'visible'}</> : null;
}

describe('useTripEditPackingNotice', () => {
  beforeEach(() => {
    resetTripEditSaveNoticeHandoffForTests();
  });

  it('shows after focus when a packing notice was staged', async () => {
    stageTripEditPackingNotice();

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<PackingNoticeProbe />);
      await Promise.resolve();
    });

    expect(renderer.toJSON()).toBe('visible');
  });

  it('clears when the hub loses focus and shows again on a second staged save', async () => {
    stageTripEditPackingNotice();

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<PackingNoticeProbe />);
      await Promise.resolve();
    });
    expect(renderer.toJSON()).toBe('visible');

    await act(async () => {
      renderer.unmount();
    });

    stageTripEditPackingNotice();
    await act(async () => {
      renderer = TestRenderer.create(<PackingNoticeProbe />);
      await Promise.resolve();
    });

    expect(renderer.toJSON()).toBe('visible');
  });
});
