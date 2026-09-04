import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import {
  buildDraftCardAccessibilityLabel,
  buildDraftDeleteAccessibilityLabel,
  getDraftDisplayTitle,
  getDraftMetadataLine,
} from '@/features/trips/utils/draft-home-display';
import { useTheme } from '@/hooks/use-theme';

type DraftPlanningCardProps = {
  stored: StoredTripDraft;
  onResume: (draftId: string) => void;
  onDeleteRequest: (draftId: string) => void;
};

export function DraftPlanningCard({ stored, onResume, onDeleteRequest }: DraftPlanningCardProps) {
  const theme = useTheme();
  const title = getDraftDisplayTitle(stored.draft);
  const metadataLine = getDraftMetadataLine(stored.draft);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buildDraftCardAccessibilityLabel(stored)}
        onPress={() => onResume(stored.id)}
        style={({ pressed }) => [styles.mainPressable, pressed && styles.pressed]}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.accent }]}>
          <Feather name="edit-3" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="bodySemiBold" numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
            {metadataLine}
          </AppText>
        </View>
        <Feather name="arrow-right" size={20} color={theme.colors.mutedForeground} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buildDraftDeleteAccessibilityLabel(stored)}
        onPress={() => onDeleteRequest(stored.id)}
        style={({ pressed }) => [
          styles.menuButton,
          {
            backgroundColor: theme.colors.muted,
            borderLeftColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Feather name="more-horizontal" size={18} color={theme.colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 14,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.95,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  menuButton: {
    width: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
