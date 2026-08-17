import { router } from 'expo-router';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { TripSummaryPlaceholderScreen } from '@/features/trip-creation/screens/trip-summary-placeholder-screen';

export default function TripSummaryRoute() {
  return (
    <AppScreen>
      <ScreenHeader title="Trip summary" onBack={() => router.back()} />
      <TripSummaryPlaceholderScreen embedded />
    </AppScreen>
  );
}
