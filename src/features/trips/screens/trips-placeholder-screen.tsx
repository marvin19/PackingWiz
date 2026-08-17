import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useTrips } from '@/hooks/use-trips';

export function TripsPlaceholderScreen() {
  const { trips, isLoading } = useTrips();

  return (
    <PlaceholderScreen
      title="Trips"
      description={
        isLoading
          ? 'Loading trips…'
          : `${trips.length} trip(s) loaded. Full trip list UI coming next.`
      }
    />
  );
}
