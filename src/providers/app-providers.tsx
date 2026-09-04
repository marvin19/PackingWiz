import type { ReactNode } from 'react';

import { AuthProvider } from '@/providers/auth-provider';
import { ProfileProvider } from '@/providers/profile-provider';
import { ServicesProvider } from '@/providers/services-provider';
import { ReuseTripSessionProvider } from '@/providers/reuse-trip-session-provider';
import { TripsProvider } from '@/providers/trips-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ServicesProvider>
        <ProfileProvider>
          <TripsProvider>
            <ReuseTripSessionProvider>{children}</ReuseTripSessionProvider>
          </TripsProvider>
        </ProfileProvider>
      </ServicesProvider>
    </AuthProvider>
  );
}
