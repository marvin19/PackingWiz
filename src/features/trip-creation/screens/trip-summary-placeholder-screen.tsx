import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

type TripSummaryPlaceholderScreenProps = {
  embedded?: boolean;
};

export function TripSummaryPlaceholderScreen({
  embedded = false,
}: TripSummaryPlaceholderScreenProps) {
  return (
    <PlaceholderScreen
      embedded={embedded}
      title="Trip summary"
      description="Review your trip details before generating a packing list."
    />
  );
}
