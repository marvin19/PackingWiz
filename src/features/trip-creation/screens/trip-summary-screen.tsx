import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import { durationDays, formatRange } from '@/domain/dates';
import { SummaryFooter } from '@/features/trip-creation/components/summary-footer';
import { SummarySection } from '@/features/trip-creation/components/summary-section';
import { TripFact } from '@/features/trip-creation/components/trip-fact';
import { WeatherPreview } from '@/features/trip-creation/components/weather-preview';
import { getAccommodationIcon, getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import {
  getAccommodationLabel,
  getLaundryLabel,
  getTravelerCountLabel,
  getTripContextLabel,
} from '@/features/trip-creation/utils/summary-labels';
import { getTripContextIcon } from '@/features/trips/utils/trip-context-icon';
import { useTheme } from '@/hooks/use-theme';
import { useTrips } from '@/hooks/use-trips';
import { blurActiveElement } from '@/lib/blur-active-element';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function TripSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { draft } = useTrips();

  const days = useMemo(
    () => (draft.startDate && draft.endDate ? durationDays(draft.startDate, draft.endDate) : 0),
    [draft.endDate, draft.startDate],
  );

  const destinationLabel = getDestinationLabel(draft.destination);
  const countryLabel = getDestinationCountryLabel(draft.destination);
  const contextIcon = getTripContextIcon(draft.tripContext[0]);
  const accommodationIcon = getAccommodationIcon(draft.accommodation ?? 'hotel');
  const weatherKey = `${destinationLabel}-${draft.startDate}-${draft.endDate}-${countryLabel}`;

  const handleBack = () => {
    blurActiveElement();
    router.replace('/trip/create');
  };

  const handleGenerate = () => {
    blurActiveElement();
    router.push('/trip/generating');
  };

  return (
    <AppScreen>
      <ScreenHeader title="Trip summary" onBack={handleBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
            {destinationLabel || 'Your trip'}
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.heroMeta}>
            {countryLabel ? `${countryLabel} · ` : ''}
            {formatRange(draft.startDate, draft.endDate)}
            {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
          </AppText>
        </View>

        <View style={styles.factsGrid}>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name={contextIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Trip context"
              value={getTripContextLabel(draft.tripContext)}
            />
            <TripFact
              icon={<Feather name={accommodationIcon} size={16} color={theme.colors.mutedForeground} />}
              label="Staying in"
              value={getAccommodationLabel(draft.accommodation)}
            />
          </View>
          <View style={styles.factsRow}>
            <TripFact
              icon={<Feather name="users" size={16} color={theme.colors.mutedForeground} />}
              label="Travelers"
              value={getTravelerCountLabel(draft.travelers.length)}
            />
            <TripFact
              icon={<Feather name="droplet" size={16} color={theme.colors.mutedForeground} />}
              label="Laundry"
              value={getLaundryLabel(draft.laundry)}
            />
          </View>
        </View>

        {draft.tripContext.length > 0 ? (
          <SummarySection title="Trip context">
            <View style={styles.chipRow}>
              {draft.tripContext.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <AppText variant="bodySmall" color="secondaryForeground">
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          </SummarySection>
        ) : null}

        {draft.bags.length > 0 ? (
          <SummarySection title="Packing in">
            <View style={styles.bagList}>
              {draft.bags.map((bag) => {
                const owner = draft.travelers.find((traveler) => traveler.id === bag.ownerId);
                const bagIcon = getBagIcon(bag.type);

                return (
                  <View
                    key={bag.id}
                    style={[
                      styles.bagRow,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <View style={[styles.bagIconWrap, { backgroundColor: theme.colors.accent }]}>
                      <Feather name={bagIcon} size={16} color={theme.colors.primary} />
                    </View>
                    <AppText variant="bodySmall" numberOfLines={1} style={styles.bagName}>
                      {bag.name}
                    </AppText>
                    <View style={[styles.ownerChip, { backgroundColor: theme.colors.secondary }]}>
                      <AppText variant="micro" color="secondaryForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                        {owner ? owner.name : 'Shared'}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          </SummarySection>
        ) : null}

        <WeatherPreview key={weatherKey} draft={draft} />

        {draft.note ? (
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: theme.colors.muted,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText variant="sectionLabel" color="mutedForeground">
              Your note
            </AppText>
            <AppText variant="bodySmall" style={styles.noteBody}>
              {draft.note}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      <SummaryFooter onPress={handleGenerate} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 20,
    gap: 4,
  },
  heroMeta: {
    lineHeight: 20,
  },
  factsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  factsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bagList: {
    gap: 8,
  },
  bagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bagIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Inter_600SemiBold',
  },
  ownerChip: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    marginBottom: 8,
  },
  noteBody: {
    lineHeight: 20,
  },
});
