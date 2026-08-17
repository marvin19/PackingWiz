import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

type CreateTripPlaceholderScreenProps = {
  embedded?: boolean;
};

export function CreateTripPlaceholderScreen({ embedded = false }: CreateTripPlaceholderScreenProps) {
  return (
    <PlaceholderScreen
      embedded={embedded}
      title="New trip"
      description="Multi-step trip creation wizard coming next."
    />
  );
}
