import type { ReactNode } from 'react';

import { AuthProvider } from '@/providers/auth-provider';
import { ServicesProvider } from '@/providers/services-provider';
import { TripsProvider } from '@/providers/trips-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ServicesProvider>
        <TripsProvider>{children}</TripsProvider>
      </ServicesProvider>
    </AuthProvider>
  );
}
