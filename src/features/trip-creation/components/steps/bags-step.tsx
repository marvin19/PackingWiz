import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BAG_TYPES } from '@/domain/catalog';
import type { Bag, BagType } from '@/domain/bag';
import type { TripDraft } from '@/domain/trip-draft';
import { BagRow } from '@/features/trip-creation/components/bag-row';
import { getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import { useTheme } from '@/hooks/use-theme';

type BagsStepProps = {
  draft: TripDraft;
  onAddBag: (type: BagType) => void;
  onUpdateBag: (bagId: string, patch: Partial<Bag>) => void;
  onRemoveBag: (bagId: string) => void;
};

export function BagsStep({ draft, onAddBag, onUpdateBag, onRemoveBag }: BagsStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color="mutedForeground" style={styles.hint}>
        Add your bags and link each to whoever&apos;s carrying it. Optional, but it makes the list
        easier to split.
      </AppText>

      <View>
        <AppText variant="sectionLabel" color="mutedForeground" style={styles.quickAddLabel}>
          Quick add
        </AppText>
        <View style={styles.quickAddRow}>
          {BAG_TYPES.map((bagType) => (
            <Pressable
              key={bagType.id}
              accessibilityRole="button"
              accessibilityLabel={`Add ${bagType.label}`}
              onPress={() => onAddBag(bagType.id)}
              style={({ pressed }) => [
                styles.quickAddChip,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <Feather name={getBagIcon(bagType.id)} size={16} color={theme.colors.primary} />
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                {bagType.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {draft.bags.length > 0 ? (
        <View style={styles.bagList}>
          {draft.bags.map((bag) => (
            <BagRow
              key={bag.id}
              bag={bag}
              travelers={draft.travelers}
              onUpdate={(patch) => onUpdateBag(bag.id, patch)}
              onRemove={() => onRemoveBag(bag.id)}
            />
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.emptyState,
            {
              borderColor: theme.colors.border,
              backgroundColor: `${theme.colors.muted}66`,
            },
          ]}>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyText}>
            No bags yet — tap one above, or skip this step.
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  hint: {
    marginTop: -8,
  },
  quickAddLabel: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bagList: {
    gap: 10,
  },
  emptyState: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.95,
  },
});
