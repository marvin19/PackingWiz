import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createAppServices, type AppServices } from '@/config/create-services';

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => createAppServices(), []);

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

export type { AppServices as Services };
