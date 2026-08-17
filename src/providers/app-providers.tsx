import type { ReactNode } from 'react';

import { ServicesProvider } from '@/providers/services-provider';
import { TripsProvider } from '@/providers/trips-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ServicesProvider>
      <TripsProvider>{children}</TripsProvider>
    </ServicesProvider>
  );
}
