import { router } from 'expo-router';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { PackOverviewPlaceholderScreen } from '@/features/packing/screens/pack-overview-placeholder-screen';

export default function PackOverviewRoute() {
  return (
    <AppScreen>
      <ScreenHeader title="Trip overview" onBack={() => router.back()} border />
      <PackOverviewPlaceholderScreen embedded />
    </AppScreen>
  );
}
