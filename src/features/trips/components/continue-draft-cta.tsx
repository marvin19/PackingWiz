import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { formatRange } from '@/domain/dates';
import type { TripDraft } from '@/domain/trip-draft';
import { useTheme } from '@/hooks/use-theme';

type ContinueDraftCtaProps = {
  draft: TripDraft;
  onPress: () => void;
};

export function ContinueDraftCta({ draft, onPress }: ContinueDraftCtaProps) {
  const theme = useTheme();
  const title = draft.destination.trim() || 'Your trip in progress';
  const subtitle =
    draft.startDate && draft.endDate
      ? formatRange(draft.startDate, draft.endDate)
      : 'Pick up where you left off';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue planning ${title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.accent }]}>
        <Feather name="edit-3" size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          Continue planning
        </AppText>
        <AppText variant="bodySemiBold" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="bodySmall" color="mutedForeground" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Feather name="arrow-right" size={20} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
