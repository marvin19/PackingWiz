import { Platform } from 'react-native';

/** Blur focused element before route transitions on web to avoid aria-hidden focus warnings. */
export function blurActiveElement(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }
}
