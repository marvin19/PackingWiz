import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import { DeleteDraftConfirmSheet } from '@/features/trips/components/delete-draft-confirm-sheet';
import { DraftPlanningCard } from '@/features/trips/components/draft-planning-card';
import { getDraftDisplayTitle } from '@/features/trips/utils/draft-home-display';

type DraftPlanningListProps = {
  drafts: StoredTripDraft[];
  onResumeDraft: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
};

export function DraftPlanningList({ drafts, onResumeDraft, onDeleteDraft }: DraftPlanningListProps) {
  const [pendingDeleteDraftId, setPendingDeleteDraftId] = useState<string | null>(null);

  const pendingDeleteDraft = useMemo(
    () => drafts.find((entry) => entry.id === pendingDeleteDraftId) ?? null,
    [drafts, pendingDeleteDraftId],
  );

  const handleConfirmDelete = () => {
    if (!pendingDeleteDraftId) {
      return;
    }

    onDeleteDraft(pendingDeleteDraftId);
    setPendingDeleteDraftId(null);
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.list}>
        {drafts.map((stored) => (
          <DraftPlanningCard
            key={stored.id}
            stored={stored}
            onResume={onResumeDraft}
            onDeleteRequest={setPendingDeleteDraftId}
          />
        ))}
      </View>

      <DeleteDraftConfirmSheet
        visible={pendingDeleteDraftId !== null}
        draftTitle={pendingDeleteDraft ? getDraftDisplayTitle(pendingDeleteDraft.draft) : null}
        onCancel={() => setPendingDeleteDraftId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
