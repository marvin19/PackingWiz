import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useAcknowledgePostCreateNavigation } from '@/features/trip-creation/hooks/use-acknowledge-post-create-navigation';

const mockAcknowledge = jest.fn();
let mockIsCommitDraftInFlight = false;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory scope
    const { useEffect } = require('react');
    useEffect(() => {
      return effect();
    }, [effect]);
  },
}));

jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    isCommitDraftInFlight: mockIsCommitDraftInFlight,
    acknowledgeCommitDraftNavigation: mockAcknowledge,
  }),
}));

function AcknowledgeProbe() {
  useAcknowledgePostCreateNavigation();
  return null;
}

describe('useAcknowledgePostCreateNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCommitDraftInFlight = false;
  });

  it('does not acknowledge before commit navigation is in flight', async () => {
    await act(async () => {
      TestRenderer.create(<AcknowledgeProbe />);
    });

    expect(mockAcknowledge).not.toHaveBeenCalled();
  });

  it('acknowledges once Pack or picker gains focus while commit is in flight', async () => {
    mockIsCommitDraftInFlight = true;

    await act(async () => {
      TestRenderer.create(<AcknowledgeProbe />);
    });

    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('remains harmless when focus runs again after in-flight already cleared', async () => {
    mockIsCommitDraftInFlight = true;

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<AcknowledgeProbe />);
    });
    expect(mockAcknowledge).toHaveBeenCalledTimes(1);

    mockIsCommitDraftInFlight = false;
    mockAcknowledge.mockClear();

    await act(async () => {
      renderer.update(<AcknowledgeProbe />);
    });

    expect(mockAcknowledge).not.toHaveBeenCalled();
  });
});
