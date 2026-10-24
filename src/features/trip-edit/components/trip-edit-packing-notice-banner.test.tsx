import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { TripEditPackingNoticeBanner } from '@/features/trip-edit/components/trip-edit-packing-notice-banner';
import {
  TRIP_EDIT_PACKING_NOTICE_BODY,
  TRIP_EDIT_PACKING_NOTICE_TITLE,
} from '@/features/trip-edit/utils/edit-trip-view-model';

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@/hooks/use-theme', () => {
  const { theme } = jest.requireActual('@/theme') as typeof import('@/theme');
  return { useTheme: () => theme };
});

describe('TripEditPackingNoticeBanner', () => {
  it('renders title and body visibly for narrow layouts', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(<TripEditPackingNoticeBanner />);
    });

    expect(tree.root.findByProps({ testID: 'trip-edit-packing-notice-banner' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'trip-edit-packing-notice-title' }).props.children).toBe(
      TRIP_EDIT_PACKING_NOTICE_TITLE,
    );
    expect(tree.root.findByProps({ testID: 'trip-edit-packing-notice-body' }).props.children).toBe(
      TRIP_EDIT_PACKING_NOTICE_BODY,
    );
  });
});
