import { hitSlopToMinTouchTarget, TOUCH_TARGET_MIN } from '@/lib/compact-touch-target';

describe('compact-touch-target (PW-005A-B1)', () => {
  it.each([
    [28, 8],
    [32, 6],
    [36, 4],
  ])('hitSlop for %ipt visible reaches %ipt', (visible, pad) => {
    const slop = hitSlopToMinTouchTarget(visible);
    expect(slop).toEqual({ top: pad, bottom: pad, left: pad, right: pad });
    expect(visible + slop.top + slop.bottom).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN);
    expect(visible + slop.left + slop.right).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN);
  });
});