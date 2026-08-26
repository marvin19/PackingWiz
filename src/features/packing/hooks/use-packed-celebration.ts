import { useEffect, useRef, useState } from 'react';

export function usePackedCelebration(
  tripId: string | null,
  packingListId: string | null,
  pct: number,
  total: number,
) {
  const [visible, setVisible] = useState(false);
  const prevPctRef = useRef(pct);
  const prevScopeRef = useRef(`${tripId ?? ''}:${packingListId ?? ''}`);
  const dismissedForCompletionRef = useRef(false);

  useEffect(() => {
    const scope = `${tripId ?? ''}:${packingListId ?? ''}`;
    if (prevScopeRef.current !== scope) {
      prevScopeRef.current = scope;
      prevPctRef.current = pct;
      dismissedForCompletionRef.current = false;
      setVisible(false);
      return;
    }

    if (total > 0 && pct < 100) {
      dismissedForCompletionRef.current = false;
    }

    if (total > 0 && pct === 100 && prevPctRef.current < 100 && !dismissedForCompletionRef.current) {
      setVisible(true);
    }

    prevPctRef.current = pct;
  }, [pct, total, tripId, packingListId]);

  const dismiss = () => {
    dismissedForCompletionRef.current = true;
    setVisible(false);
  };

  return { visible, dismiss };
}
