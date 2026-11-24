/** Minimum recommended touch target (pt) for MVP accessibility (PW-005A-B1). */
export const TOUCH_TARGET_MIN = 44;

export type TouchHitSlop = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Expands hit area symmetrically so visible `size` + slop reaches `TOUCH_TARGET_MIN`. */
export function hitSlopToMinTouchTarget(visibleSize: number): TouchHitSlop {
  const pad = Math.max(0, Math.ceil((TOUCH_TARGET_MIN - visibleSize) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
}