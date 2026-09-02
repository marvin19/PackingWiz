import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import { DraftPlanningList } from '@/features/trips/components/draft-planning-list';
import {
  buildViewAllDraftsAccessibilityLabel,
  buildViewAllDraftsLabel,
  getHomeDraftPreview,
} from '@/features/trips/utils/draft-home-preview';
import { useTheme } from '@/hooks/use-theme';

type ContinuePlanningSectionProps = {
  drafts: StoredTripDraft[];
  onResumeDraft: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  onViewAllDrafts?: () => void;
};

export function ContinuePlanningSection({
  drafts,
  onResumeDraft,
  onDeleteDraft,
  onViewAllDrafts,
}: ContinuePlanningSectionProps) {
  const theme = useTheme();
  const { visibleDrafts, totalCount, hasMore } = getHomeDraftPreview(drafts);

  if (drafts.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionTitle>Continue planning</SectionTitle>
      <DraftPlanningList
        drafts={visibleDrafts}
        onResumeDraft={onResumeDraft}
        onDeleteDraft={onDeleteDraft}
      />

      {hasMore && onViewAllDrafts ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={buildViewAllDraftsAccessibilityLabel(totalCount)}
          onPress={onViewAllDrafts}
          style={({ pressed }) => [
            styles.viewAllButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            {buildViewAllDraftsLabel(totalCount)}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    gap: 10,
  },
  viewAllButton: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
});
