import { StyleSheet } from 'react-native';

/** Visible chip height from pre–PW-004D-A PackTripMenuButton. */
const PACK_HEADER_CHIP_MIN_HEIGHT = 32;
const PACK_HEADER_CHIP_TOUCH_TARGET = 44;

const verticalHitSlop = Math.max(
  0,
  Math.ceil((PACK_HEADER_CHIP_TOUCH_TARGET - PACK_HEADER_CHIP_MIN_HEIGHT) / 2),
);

/** Vertical expansion only — avoids horizontal overlap between adjacent header chips. */
export const packHeaderChipButtonHitSlop = {
  top: verticalHitSlop,
  bottom: verticalHitSlop,
  left: 0,
  right: 0,
} as const;

/** Shared chrome for Pack header Filter + Trip menu controls. */
export const packHeaderChipButtonStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: PACK_HEADER_CHIP_MIN_HEIGHT,
    justifyContent: 'center',
    flexShrink: 0,
  },
});