import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput, Field } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { DateField } from '@/components/ui/date-field';
import {
  createDestinationFromText,
  getDestinationLabel,
} from '@/domain/destination';
import { formatTripDurationDays } from '@/domain/count-display';
import { durationDays, parseDate } from '@/domain/dates';
import {
  getEditTripDateValidationMessage,
  validateEditTripDateRange,
} from '@/domain/edit-trip-date-validation';
import {
  getNewTripDateValidationMessage,
  startOfLocalCalendarDay,
  validateNewTripDateRange,
} from '@/domain/new-trip-date-validation';
import type { TripDraft } from '@/domain/trip-draft';
import {
  DESTINATION_SUGGESTIONS,
  suggestionToDestination,
} from '@/features/trip-creation/constants';
import { TripNameField } from '@/features/trip-creation/components/trip-name-field';
import { useTheme } from '@/hooks/use-theme';

export type DestinationStepDateValidationMode = 'new-trip' | 'edit-existing';

type DestinationStepProps = {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
  /** When set, shows the optional trip name field (creation wizard only). */
  onChangeName?: (name: string) => void;
  dateValidationMode?: DestinationStepDateValidationMode;
};

export function DestinationStep({
  draft,
  onChange,
  onChangeName,
  dateValidationMode = 'new-trip',
}: DestinationStepProps) {
  const theme = useTheme();
  const [destinationFocused, setDestinationFocused] = useState(false);
  const days =
    draft.startDate && draft.endDate && durationDays(draft.startDate, draft.endDate);
  const isEditExisting = dateValidationMode === 'edit-existing';
  const minimumStartDate = isEditExisting ? undefined : startOfLocalCalendarDay(new Date());
  const dateError = isEditExisting
    ? getEditTripDateValidationMessage(
        validateEditTripDateRange(draft.startDate, draft.endDate),
      )
    : getNewTripDateValidationMessage(
        validateNewTripDateRange(draft.startDate, draft.endDate),
      );

  return (
    <View style={styles.container}>
      <Field label="Destination" required>
        <View>
          <Feather
            name="search"
            size={16}
            color={theme.colors.mutedForeground}
            style={styles.searchIcon}
          />
          <AppTextInput
            value={getDestinationLabel(draft.destination)}
            onChangeText={(displayName) =>
              onChange({
                destination: createDestinationFromText(
                  displayName,
                  draft.destination.countryName,
                ),
              })
            }
            placeholder="Search a city or country"
            focused={destinationFocused}
            onFocus={() => setDestinationFocused(true)}
            onBlur={() => setDestinationFocused(false)}
            style={styles.destinationInput}
            accessibilityLabel="Destination, required"
          />
        </View>
        <View style={styles.suggestions}>
          {DESTINATION_SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion.destination}
              accessibilityRole="button"
              accessibilityLabel={`Use ${suggestion.destination}`}
              onPress={() =>
                onChange({
                  destination: suggestionToDestination(suggestion),
                })
              }
              style={({ pressed }) => [
                styles.suggestion,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <Feather name="map-pin" size={12} color={theme.colors.primary} />
              <AppText variant="caption" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                {suggestion.destination}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Field>

      {onChangeName ? (
        <TripNameField
          draft={draft}
          onChangeName={onChangeName}
          label="Trip name (optional)"
        />
      ) : null}

      <View style={styles.dateRow}>
        <DateField
          label="Departure"
          value={draft.startDate}
          onChange={(startDate) => onChange({ startDate })}
          minimumDate={minimumStartDate}
          required
        />
        <DateField
          label="Return"
          value={draft.endDate}
          onChange={(endDate) => onChange({ endDate })}
          required
          minimumDate={
            draft.startDate
              ? parseDate(draft.startDate)
              : isEditExisting
                ? undefined
                : minimumStartDate
          }
        />
      </View>

      {dateError ? (
        <AppText variant="bodySmall" color="destructive" style={styles.dateError}>
          {dateError}
        </AppText>
      ) : null}

      {days && days > 0 ? (
        <View style={[styles.durationBanner, { backgroundColor: theme.colors.accent }]}>
          <AppText variant="bodySmall" color="accentForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
            Trip duration: {formatTripDurationDays(days)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 16,
    zIndex: 1,
  },
  destinationInput: {
    paddingLeft: 40,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateError: {
    lineHeight: 20,
  },
  durationBanner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.95,
  },
});
