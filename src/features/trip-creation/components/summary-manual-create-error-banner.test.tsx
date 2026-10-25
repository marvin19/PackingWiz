import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { SummaryManualCreateErrorBanner } from '@/features/trip-creation/components/summary-manual-create-error-banner';
import {
  SUMMARY_MANUAL_CREATE_ERROR_BODY,
  SUMMARY_MANUAL_CREATE_ERROR_TITLE,
} from '@/features/trip-creation/constants/summary-manual-create-copy';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('SummaryManualCreateErrorBanner', () => {
  it('renders title and body with alert accessibility semantics', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(<SummaryManualCreateErrorBanner />);
    });

    const banner = tree.root.findByProps({ testID: 'summary-manual-create-error-banner' });
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(banner.props.accessibilityLiveRegion).toBe('assertive');
    expect(banner.props.accessibilityLabel).toBe(
      `${SUMMARY_MANUAL_CREATE_ERROR_TITLE}. ${SUMMARY_MANUAL_CREATE_ERROR_BODY}`,
    );
    expect(tree.root.findByProps({ testID: 'summary-manual-create-error-title' }).props.children).toBe(
      SUMMARY_MANUAL_CREATE_ERROR_TITLE,
    );
    expect(tree.root.findByProps({ testID: 'summary-manual-create-error-body' }).props.children).toBe(
      SUMMARY_MANUAL_CREATE_ERROR_BODY,
    );
  });
});
