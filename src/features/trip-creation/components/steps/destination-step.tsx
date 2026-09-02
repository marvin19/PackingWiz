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
import { durationDays, parseDate } from '@/domain/dates';
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
import { useTheme } from '@/hooks/use-theme';

type DestinationStepProps = {
  draft: TripDraft;
  onChange: (patch: Partial<TripDraft>) => void;
};

export function DestinationStep({ draft, onChange }: DestinationStepProps) {
  const theme = useTheme();
  const [destinationFocused, setDestinationFocused] = useState(false);
  const days =
    draft.startDate && draft.endDate && durationDays(draft.startDate, draft.endDate);
  const minimumStartDate = startOfLocalCalendarDay(new Date());
  const dateValidation = validateNewTripDateRange(draft.startDate, draft.endDate);
  const dateError = getNewTripDateValidationMessage(dateValidation);

  return (
    <View style={styles.container}>
      <Field label="Destination">
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
            accessibilityLabel="Destination"
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

      <View style={styles.dateRow}>
        <DateField
          label="Departure"
          value={draft.startDate}
          onChange={(startDate) => onChange({ startDate })}
          minimumDate={minimumStartDate}
        />
        <DateField
          label="Return"
          value={draft.endDate}
          onChange={(endDate) => onChange({ endDate })}
          minimumDate={draft.startDate ? parseDate(draft.startDate) : minimumStartDate}
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
            Trip duration: {days} {days === 1 ? 'day' : 'days'}
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
