import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useTrips } from '@/hooks/use-trips';

export function PackPlaceholderScreen() {
  const { activeTrip } = useTrips();

  return (
    <PlaceholderScreen
      title="Pack"
      description={
        activeTrip
          ? `Active trip: ${activeTrip.destination}. Packing list UI coming next.`
          : 'No active trip selected. Packing list UI coming next.'
      }
    />
  );
}
