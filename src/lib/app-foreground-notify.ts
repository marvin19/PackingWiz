import { AppState, type AppStateStatus } from 'react-native';

/** Single shared AppState listener; screens subscribe when they need foreground date refresh. */
const listeners = new Set<() => void>();
let subscribed = false;

function ensureAppStateSubscription(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      listeners.forEach((listener) => listener());
    }
  });
}

export function subscribeAppForegroundNotify(listener: () => void): () => void {
  ensureAppStateSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}