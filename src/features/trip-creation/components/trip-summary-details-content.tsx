import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { AccommodationId, LaundryOption } from '@/domain/trip';
import { durationDays, formatRange } from '@/domain/dates';
import { SummaryDetailCard } from '@/features/trip-creation/components/summary-detail-card';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { getAccommodationIcon, getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  getBagsSummaryLabel,
  getStayingInSummaryLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import type { TripSummaryDetailsMode } from '@/features/trip-edit/utils/trip-details-navigation';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';
import { Feather } from '@expo/vector-icons';

export type TripSummaryDetailsFacts = {
  destinationLabel: string;
  countryLabel: string;
  startDate: string;
  endDate: string;
  tripContext: string[];
  accommodation?: AccommodationId | null;
  laundry?: LaundryOption | null;
  packingForLabel: string;
  bags: Parameters<typeof getBagsSummaryLabel>[0];
  note: string;
};

export type TripSummaryDetailsEditHandlers = {
  onEditDestination?: () => void;
  onEditTripContext?: () => void;
  onEditStayingIn?: () => void;
  onEditPackingFor?: () => void;
  onEditPackingIn?: () => void;
  onEditNote?: () => void;
};

type TripSummaryDetailsContentProps = {
  mode: TripSummaryDetailsMode;
  facts: TripSummaryDetailsFacts;
  editHandlers: TripSummaryDetailsEditHandlers;
  weatherSlot?: ReactNode;
  importantSlot?: ReactNode;
};

export function TripSummaryDetailsContent({
  mode,
  facts,
  editHandlers,
  weatherSlot,
  importantSlot,
}: TripSummaryDetailsContentProps) {
  const theme = useTheme();
  const days =
    facts.startDate && facts.endDate ? durationDays(facts.startDate, facts.endDate) : 0;
  const tripContextIcon = getTripContextIcon(facts.tripContext[0]);
  const accommodationIcon = getAccommodationIcon(facts.accommodation ?? 'hotel');
  const packingInIcon = getBagIcon('carryon');
  const isEditable = mode === 'existing' || mode === 'create';

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
              {facts.destinationLabel || 'Your trip'}
            </AppText>
            <AppText variant="bodySmall" color="mutedForeground" style={styles.heroMeta}>
              {facts.countryLabel ? `${facts.countryLabel} · ` : ''}
              {formatRange(facts.startDate, facts.endDate)}
              {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
            </AppText>
          </View>
          {isEditable && editHandlers.onEditDestination ? (
            <SummaryEditButton
              accessibilityLabel="Edit destination and dates"
              onPress={editHandlers.onEditDestination}
              compact
            />
          ) : null}
        </View>
      </View>

      <View style={styles.factsStack}>
        <SummaryDetailCard
          icon={<Feather name={tripContextIcon} size={16} color={theme.colors.primary} />}
          title="Trip context"
          editAccessibilityLabel="Edit trip context"
          onEdit={editHandlers.onEditTripContext}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            {getTripContextLabel(facts.tripContext)}
          </AppText>
        </SummaryDetailCard>

        <SummaryDetailCard
          icon={<Feather name={accommodationIcon} size={16} color={theme.colors.primary} />}
          title="Staying in"
          editAccessibilityLabel="Edit accommodation and laundry"
          onEdit={editHandlers.onEditStayingIn}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            {getStayingInSummaryLabel(facts.accommodation ?? null, facts.laundry ?? null)}
          </AppText>
        </SummaryDetailCard>

        <SummaryDetailCard
          icon={<Feather name="users" size={16} color={theme.colors.primary} />}
          title="Packing for"
          editAccessibilityLabel="Manage travellers"
          onEdit={editHandlers.onEditPackingFor}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            {facts.packingForLabel}
          </AppText>
        </SummaryDetailCard>

        <SummaryDetailCard
          icon={<Feather name={packingInIcon} size={16} color={theme.colors.primary} />}
          title="Packing in"
          editAccessibilityLabel="Edit bags"
          onEdit={editHandlers.onEditPackingIn}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.factValue}>
            {getBagsSummaryLabel(facts.bags)}
          </AppText>
        </SummaryDetailCard>
      </View>

      {mode === 'create' && weatherSlot ? weatherSlot : null}

      {mode === 'create' && importantSlot ? importantSlot : null}

      <SummaryDetailCard
        icon={<Feather name="file-text" size={16} color={theme.colors.primary} />}
        title="Additional information"
        editAccessibilityLabel="Edit additional information"
        onEdit={editHandlers.onEditNote}>
        {facts.note ? (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.noteBody}>
            {facts.note}
          </AppText>
        ) : (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.noteBody}>
            No information added
          </AppText>
        )}
      </SummaryDetailCard>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  heroMeta: {
    lineHeight: 20,
  },
  factsStack: {
    gap: 0,
    marginBottom: spacing.lg,
  },
  factValue: {
    lineHeight: 20,
  },
  noteBody: {
    lineHeight: 20,
  },
});
