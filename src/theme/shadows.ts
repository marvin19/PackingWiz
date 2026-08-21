import { Platform, type ViewStyle } from 'react-native';

type ShadowOptions = {
  offsetY?: number;
  blur?: number;
  opacity?: number;
  elevation?: number;
};

function isWebPlatform(): boolean {
  return Platform.OS === 'web' || process.env.EXPO_OS === 'web';
}

/** Platform-aware card shadow (avoids deprecated shadow* props on web). */
export function cardShadow(color: string, options: ShadowOptions = {}): ViewStyle {
  const { offsetY = 1, blur = 3, opacity = 0.08, elevation = 2 } = options;

  if (isWebPlatform()) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return {
      boxShadow: `0px ${offsetY}px ${blur}px ${color}${alpha}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

/** Stronger floating action button shadow. */
export function fabShadow(color = '#000000'): ViewStyle {
  return cardShadow(color, { offsetY: 4, blur: 8, opacity: 0.15, elevation: 4 });
}
