import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { OptionCard } from '@/components/ui/option-card';
import { RadioRow } from '@/components/ui/radio-row';
import { AppText } from '@/components/ui/app-text';
import { ACCOMMODATIONS, LAUNDRY_OPTIONS } from '@/domain/catalog';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import type { TripDraft } from '@/domain/trip-draft';
import { getAccommodationIcon } from '@/features/trip-creation/utils/catalog-icons';
import { useTheme } from '@/hooks/use-theme';

type AccommodationStepProps = {
  draft: TripDraft;
  onSelectAccommodation: (id: AccommodationId) => void;
  onSelectLaundry: (id: LaundryOption) => void;
};

export function AccommodationStep({
  draft,
  onSelectAccommodation,
  onSelectLaundry,
}: AccommodationStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View>
        <AppText variant="bodySmall" style={styles.sectionLabel}>
          Accommodation
        </AppText>
        <View style={styles.grid}>
          {ACCOMMODATIONS.map((accommodation) => (
            <OptionCard
              key={accommodation.id}
              compact
              label={accommodation.label}
              icon={getAccommodationIcon(accommodation.id)}
              selected={draft.accommodation === accommodation.id}
              onPress={() => onSelectAccommodation(accommodation.id)}
            />
          ))}
        </View>
      </View>

      <View>
        <View style={styles.laundryHeading}>
          <Feather name="droplet" size={16} color={theme.colors.primary} />
          <AppText variant="bodySmall" style={styles.sectionLabel}>
            Will you be able to wash clothes?
          </AppText>
        </View>
        <AppText variant="caption" color="mutedForeground" style={styles.laundryHint}>
          We use this to decide how much clothing you really need.
        </AppText>
        <View style={styles.radioList}>
          {LAUNDRY_OPTIONS.map((option) => (
            <RadioRow
              key={option.id}
              label={option.label}
              selected={draft.laundry === option.id}
              onPress={() => onSelectLaundry(option.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  sectionLabel: {
    paddingHorizontal: 4,
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  laundryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  laundryHint: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  radioList: {
    gap: 8,
  },
});
