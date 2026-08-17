import { StyleSheet, View } from 'react-native';

import { OptionCard } from '@/components/ui/option-card';
import { AppText } from '@/components/ui/app-text';
import { TRIP_TYPES } from '@/domain/catalog';
import type { TripTypeId } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { getTripTypeIcon } from '@/features/trips/utils/trip-type-icon';

type TripTypesStepProps = {
  draft: TripDraft;
  onToggleType: (typeId: TripTypeId) => void;
};

export function TripTypesStep({ draft, onToggleType }: TripTypesStepProps) {
  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        Pick everything that fits — you can mix, like outdoor and beach.
      </AppText>
      <View style={styles.grid}>
        {TRIP_TYPES.map((tripType) => (
          <OptionCard
            key={tripType.id}
            label={tripType.label}
            icon={getTripTypeIcon(tripType.id)}
            selected={draft.types.includes(tripType.id)}
            onPress={() => onToggleType(tripType.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  hint: {
    marginTop: -8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
