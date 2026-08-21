import type { Href } from 'expo-router';
import { router } from 'expo-router';

/** Goes back when possible; otherwise replaces with a safe fallback route. */
export function goBackOrReplace(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
