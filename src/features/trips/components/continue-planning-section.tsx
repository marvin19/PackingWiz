import { View } from 'react-native';

import { SectionTitle } from '@/components/ui/section-title';
import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import { DraftPlanningList } from '@/features/trips/components/draft-planning-list';
import { HomeViewAllLink } from '@/features/trips/components/home-view-all-link';
import {
  buildViewAllDraftsAccessibilityLabel,
  buildViewAllDraftsLabel,
  getHomeDraftPreview,
} from '@/features/trips/utils/draft-home-preview';

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
  const { visibleDrafts, totalCount, hasMore } = getHomeDraftPreview(drafts);

  if (drafts.length === 0) {
    return null;
  }

  return (
    <View>
      <SectionTitle>Continue planning</SectionTitle>
      <DraftPlanningList
        drafts={visibleDrafts}
        onResumeDraft={onResumeDraft}
        onDeleteDraft={onDeleteDraft}
      />

      {hasMore && onViewAllDrafts ? (
        <HomeViewAllLink
          contextual
          label={buildViewAllDraftsLabel(totalCount)}
          accessibilityLabel={buildViewAllDraftsAccessibilityLabel(totalCount)}
          onPress={onViewAllDrafts}
        />
      ) : null}
    </View>
  );
}
