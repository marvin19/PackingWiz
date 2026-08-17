import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import type { Bag } from '@/domain/bag';
import type { Traveler } from '@/domain/traveler';
import { OwnerChip } from '@/features/trip-creation/components/owner-chip';
import { getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import { useTheme } from '@/hooks/use-theme';

type BagRowProps = {
  bag: Bag;
  travelers: Traveler[];
  onUpdate: (patch: Partial<Bag>) => void;
  onRemove: () => void;
};

export function BagRow({ bag, travelers, onUpdate, onRemove }: BagRowProps) {
  const theme = useTheme();
  const bagIcon = getBagIcon(bag.type);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.accent }]}>
          <Feather name={bagIcon} size={16} color={theme.colors.primary} />
        </View>
        <AppTextInput
          value={bag.name}
          onChangeText={(name) => onUpdate({ name })}
          placeholder="Name this bag"
          style={styles.nameInput}
          accessibilityLabel="Bag name"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${bag.name}`}
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
          <Feather name="trash-2" size={16} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={styles.ownerRow}>
        <OwnerChip
          label="Shared"
          active={bag.ownerId === null}
          onPress={() => onUpdate({ ownerId: null })}
        />
        {travelers.map((traveler) => (
          <OwnerChip
            key={traveler.id}
            label={traveler.name}
            active={bag.ownerId === traveler.id}
            onPress={() => onUpdate({ ownerId: traveler.id })}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
