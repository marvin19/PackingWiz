import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { Wordmark } from '@/components/brand/wordmark';
import { PRODUCT_DISPLAY_NAME } from '@/constants/product-brand';

jest.mock('@/components/brand/brand-mark', () => ({
  BrandMark: 'BrandMark',
}));

describe('Wordmark', () => {
  it('shows PackingWiz when the optional name label is enabled', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(<Wordmark showName />);
    });

    expect(tree.root.findByProps({ children: PRODUCT_DISPLAY_NAME })).toBeTruthy();
  });

  it('hides the name label by default', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(<Wordmark />);
    });

    expect(() => tree.root.findByProps({ children: PRODUCT_DISPLAY_NAME })).toThrow();
  });
});
