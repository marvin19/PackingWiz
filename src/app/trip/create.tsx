import { router } from 'expo-router';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { CreateTripPlaceholderScreen } from '@/features/trip-creation/screens/create-trip-placeholder-screen';

export default function CreateTripRoute() {
  return (
    <AppScreen>
      <ScreenHeader title="New trip" onBack={() => router.back()} />
      <CreateTripPlaceholderScreen embedded />
    </AppScreen>
  );
}
