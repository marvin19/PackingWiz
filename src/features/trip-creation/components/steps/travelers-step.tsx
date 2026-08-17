import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/app-text';
import type { Traveler, TravelerRole } from '@/domain/traveler';
import type { TripDraft } from '@/domain/trip-draft';
import { AddTravelerForm } from '@/features/trip-creation/components/add-traveler-form';
import { TravelerRow } from '@/features/trip-creation/components/traveler-row';
import { TRAVELER_PRESETS } from '@/features/trip-creation/constants';
import { useTheme } from '@/hooks/use-theme';

type TravelersStepProps = {
  draft: TripDraft;
  onApplyPreset: (travelers: Traveler[]) => void;
  onAddTraveler: (name: string, role: TravelerRole) => void;
  onRemoveTraveler: (travelerId: string) => void;
};

function isPresetActive(draftTravelers: Traveler[], presetTravelers: Traveler[]): boolean {
  return (
    draftTravelers.length === presetTravelers.length &&
    draftTravelers.every((traveler, index) => traveler.name === presetTravelers[index]?.name)
  );
}

export function TravelersStep({
  draft,
  onApplyPreset,
  onAddTraveler,
  onRemoveTraveler,
}: TravelersStepProps) {
  const theme = useTheme();
  const [addingTraveler, setAddingTraveler] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.presets}>
        {TRAVELER_PRESETS.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            selected={isPresetActive(draft.travelers, preset.travelers)}
            onPress={() => onApplyPreset(preset.travelers)}
          />
        ))}
      </View>

      <View style={styles.list}>
        {draft.travelers.map((traveler) => (
          <TravelerRow
            key={traveler.id}
            traveler={traveler}
            canRemove={draft.travelers.length > 1}
            onRemove={() => onRemoveTraveler(traveler.id)}
          />
        ))}
      </View>

      {addingTraveler ? (
        <AddTravelerForm
          onAdd={(name, role) => {
            onAddTraveler(name, role);
            setAddingTraveler(false);
          }}
          onCancel={() => setAddingTraveler(false)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add traveler"
          onPress={() => setAddingTraveler(true)}
          style={({ pressed }) => [
            styles.addTrigger,
            { borderColor: theme.colors.border },
            pressed && styles.pressed,
          ]}>
          <Feather name="plus" size={16} color={theme.colors.primary} />
          <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            Add traveler
          </AppText>
        </Pressable>
      )}

      <View style={[styles.infoBanner, { backgroundColor: theme.colors.muted }]}>
        <Feather name="users" size={16} color={theme.colors.primary} style={styles.infoIcon} />
        <AppText variant="caption" color="mutedForeground" style={styles.infoText}>
          We tailor items to each person — kids get age-appropriate gear based on their age.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 8,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.95,
  },
});
