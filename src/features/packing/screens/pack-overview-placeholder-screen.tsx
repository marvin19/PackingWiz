import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useTrips } from '@/hooks/use-trips';

type PackOverviewPlaceholderScreenProps = {
  embedded?: boolean;
};

export function PackOverviewPlaceholderScreen({
  embedded = false,
}: PackOverviewPlaceholderScreenProps) {
  const { activeTrip } = useTrips();

  return (
    <PlaceholderScreen
      embedded={embedded}
      title="Insights"
      description={
        activeTrip
          ? `Overview for ${activeTrip.destination}. Insights and stats UI coming next.`
          : 'No active trip selected.'
      }
    />
  );
}
