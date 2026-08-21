import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/app-text';
import { TRIP_CONTEXT_PRIMARY_TAGS } from '@/domain/catalog';
import { getExtraTripContextTags, tripContextIncludes } from '@/domain/trip-context-tags';
import type { TripDraft } from '@/domain/trip-draft';
import { AddTripTagsSheet } from '@/features/trip-creation/components/add-trip-tags-sheet';
import { useTheme } from '@/hooks/use-theme';

type TripContextStepProps = {
  draft: TripDraft;
  onToggleTag: (tag: string) => void;
  onAddTag: (tag: string) => void;
};

export function TripContextStep({ draft, onToggleTag, onAddTag }: TripContextStepProps) {
  const theme = useTheme();
  const [addTagsVisible, setAddTagsVisible] = useState(false);
  const extraTags = getExtraTripContextTags(draft.tripContext);

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        Pick anything that fits — mix tags freely or add your own.
      </AppText>

      {/* Future extension point: Suggested tags section (AI-driven) can render above the chip row. */}
      <View style={styles.chips}>
        {TRIP_CONTEXT_PRIMARY_TAGS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={tripContextIncludes(draft.tripContext, tag)}
            onPress={() => onToggleTag(tag)}
          />
        ))}
        {extraTags.map((tag) => (
          <Chip key={tag} label={tag} selected onPress={() => onToggleTag(tag)} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add tags"
        onPress={() => setAddTagsVisible(true)}
        style={({ pressed }) => [
          styles.addTagsButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
          pressed && styles.pressed,
        ]}>
        <Feather name="plus" size={16} color={theme.colors.primary} />
        <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          Add tags
        </AppText>
      </Pressable>

      <AddTripTagsSheet
        visible={addTagsVisible}
        selectedTags={draft.tripContext}
        onClose={() => setAddTagsVisible(false)}
        onToggleTag={onToggleTag}
        onAddCustomTag={onAddTag}
      />
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.9,
  },
});
