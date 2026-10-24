import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { consumeTripEditPackingNotice } from '@/features/trip-edit/utils/trip-edit-save-notice-handoff';

/**
 * Shows a one-time packing-relevant notice when Trip Details gains focus after a section save.
 * Does not depend on route params — URL changes must not re-run cleanup and hide the banner.
 */
export function useTripEditPackingNotice(): boolean {
  const [showNotice, setShowNotice] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (consumeTripEditPackingNotice()) {
        setShowNotice(true);
      }

      return () => {
        setShowNotice(false);
      };
    }, []),
  );

  return showNotice;
}
