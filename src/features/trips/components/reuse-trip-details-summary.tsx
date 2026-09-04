import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { SummaryDetailCard } from '@/features/trip-creation/components/summary-detail-card';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { getAccommodationIcon, getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  getBagsSummaryLabel,
  getStayingInSummaryLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import type { ReuseTripFormState } from '@/features/trips/utils/reuse-trip-view-model';
import type { ReuseTripSection } from '@/features/trips/utils/reuse-trip-navigation';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import { useTheme } from '@/hooks/use-theme';

type ReuseTripDetailsSummaryProps = {
  form: ReuseTripFormState;
  onEditSection: (section: ReuseTripSection) => void;
};

export function ReuseTripDetailsSummary({ form, onEditSection }: ReuseTripDetailsSummaryProps) {
  const theme = useTheme();
  const tripContextIcon = getTripContextIcon(form.tripContext[0]);
  const accommodationIcon = getAccommodationIcon(form.accommodation);
  const packingInIcon = getBagIcon('carryon');
  const destinationLabel = getDestinationLabel(form.destination);
  const countryLabel = getDestinationCountryLabel(form.destination);

  return (
    <View style={styles.stack}>
      <View style={styles.destinationRow}>
        <View style={styles.destinationCopy}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.fieldLabel}>
            Destination
          </AppText>
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            {destinationLabel || 'Add destination'}
          </AppText>
          {countryLabel ? (
            <AppText variant="caption" color="mutedForeground">
              {countryLabel}
            </AppText>
          ) : null}
        </View>
        <SummaryEditButton
          accessibilityLabel="Edit destination"
          onPress={() => onEditSection('destination')}
          compact
        />
      </View>

      <SummaryDetailCard
        icon={<Feather name={tripContextIcon} size={16} color={theme.colors.primary} />}
        title="Trip context"
        editAccessibilityLabel="Edit trip context"
        onEdit={() => onEditSection('trip-context')}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
          {getTripContextLabel(form.tripContext)}
        </AppText>
      </SummaryDetailCard>

      <SummaryDetailCard
        icon={<Feather name={accommodationIcon} size={16} color={theme.colors.primary} />}
        title="Staying in"
        editAccessibilityLabel="Edit accommodation and laundry"
        onEdit={() => onEditSection('accommodation')}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
          {getStayingInSummaryLabel(form.accommodation, form.laundry)}
        </AppText>
      </SummaryDetailCard>

      <SummaryDetailCard
        icon={<Feather name={packingInIcon} size={16} color={theme.colors.primary} />}
        title="Packing in"
        editAccessibilityLabel="Edit bags"
        onEdit={() => onEditSection('bags')}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
          {getBagsSummaryLabel(form.bags)}
        </AppText>
      </SummaryDetailCard>

      <SummaryDetailCard
        icon={<Feather name="file-text" size={16} color={theme.colors.primary} />}
        title="Additional information"
        editAccessibilityLabel="Edit additional information"
        onEdit={() => onEditSection('note')}>
        {form.note ? (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            {form.note}
          </AppText>
        ) : (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            No information added
          </AppText>
        )}
      </SummaryDetailCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 0,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  destinationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Inter_600SemiBold',
  },
  factValue: {
    lineHeight: 20,
  },
});
