import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput, Field } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { DateField } from '@/components/ui/date-field';
import { durationDays, parseDate } from '@/domain/dates';
import type { TripDraft } from '@/domain/trip-draft';
import { DESTINATION_SUGGESTIONS } from '@/features/trip-creation/constants';
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
            value={draft.destination}
            onChangeText={(destination) => onChange({ destination })}
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
                  destination: suggestion.destination,
                  country: suggestion.country,
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
        />
        <DateField
          label="Return"
          value={draft.endDate}
          onChange={(endDate) => onChange({ endDate })}
          minimumDate={draft.startDate ? parseDate(draft.startDate) : undefined}
        />
      </View>

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
  durationBanner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.95,
  },
});
