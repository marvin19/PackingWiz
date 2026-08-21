import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import { PackingItemSettingsSheet } from '@/features/packing/components/packing-item-settings-sheet';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';

export type PackingCheckboxIntent = 'packed' | 'purchased';

type PackingItemRowProps = {
  item: PackingItem;
  travelers: Traveler[];
  checkboxIntent: PackingCheckboxIntent;
  onCheckboxPress: (itemId: string) => void;
};

export function PackingItemRow({
  item,
  travelers,
  checkboxIntent,
  onCheckboxPress,
}: PackingItemRowProps) {
  const theme = useTheme();
  const { setItemQuantity, deletePackingItem } = useTrips();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const assigned = travelers.find((traveler) => traveler.id === item.assignedTo);
  const isImportant = isImportantPackingItem(item);
  const isPurchasedIntent = checkboxIntent === 'purchased';
  const checkboxChecked = isPurchasedIntent ? false : item.packed;
  const checkboxLabel = isPurchasedIntent
    ? `Mark ${item.name} as purchased`
    : item.packed
      ? `Mark ${item.name} as not packed`
      : `Mark ${item.name} as packed`;

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: item.packed ? theme.colors.muted : theme.colors.card,
            borderColor: item.source === 'important' ? `${theme.colors.important}66` : theme.colors.border,
            opacity: item.packed ? 0.92 : 1,
          },
        ]}>
        <View style={styles.mainRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={checkboxLabel}
            accessibilityState={{ checked: checkboxChecked }}
            onPress={() => onCheckboxPress(item.id)}
            style={[
              styles.checkButton,
              {
                borderColor: checkboxChecked ? theme.colors.success : theme.colors.border,
                backgroundColor: checkboxChecked ? theme.colors.success : theme.colors.card,
              },
            ]}>
            {checkboxChecked ? (
              <Feather name="check" size={16} color={theme.colors.primaryForeground} />
            ) : null}
          </Pressable>

          <View style={styles.nameBlock}>
            <AppText
              variant="bodySmall"
              numberOfLines={1}
              style={[
                styles.name,
                {
                  fontFamily: theme.fontFamilies.sansMedium,
                  color: item.packed ? theme.colors.mutedForeground : theme.colors.foreground,
                  textDecorationLine: item.packed ? 'line-through' : 'none',
                },
              ]}>
              {item.name}
            </AppText>
            <View style={styles.metaRow}>
              {item.source === 'important' ? (
                <View style={[styles.importantBadge, { backgroundColor: `${theme.colors.important}26` }]}>
                  <Feather name="alert-triangle" size={11} color={theme.colors.important} />
                  <AppText variant="micro" style={{ color: theme.colors.importantForeground, fontFamily: theme.fontFamilies.sansSemiBold }}>
                    Important
                  </AppText>
                </View>
              ) : null}
              {item.needToBuy ? (
                <View style={[styles.buyBadge, { backgroundColor: `${theme.colors.buy}26` }]}>
                  <Feather name="shopping-bag" size={11} color={theme.colors.buyForeground} />
                  <AppText variant="micro" style={{ color: theme.colors.buyForeground, fontFamily: theme.fontFamilies.sansSemiBold }}>
                    Buy
                  </AppText>
                </View>
              ) : null}
              {assigned ? (
                <View style={[styles.ownerBadge, { backgroundColor: theme.colors.secondary }]}>
                  <AppText variant="micro" color="secondaryForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                    {assigned.name}
                  </AppText>
                </View>
              ) : null}
              {item.quantity > 1 ? (
                <AppText variant="micro" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                  ×{item.quantity}
                </AppText>
              ) : null}
            </View>
            {item.note ? (
              <View style={[styles.noteBox, { backgroundColor: `${theme.colors.accent}66` }]}>
                <Feather name="info" size={12} color={theme.colors.primary} />
                <AppText variant="caption" color="accentForeground" style={styles.noteText}>
                  {item.note}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.actionsColumn}>
            {!isImportant ? (
              <>
                <View style={styles.quantityControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity of ${item.name}`}
                    disabled={item.quantity <= 1}
                    onPress={() => setItemQuantity(item.id, item.quantity - 1)}
                    style={({ pressed }) => [
                      styles.iconButton,
                      {
                        backgroundColor: theme.colors.muted,
                        opacity: item.quantity <= 1 ? 0.35 : pressed ? 0.85 : 1,
                      },
                    ]}>
                    <Feather name="minus" size={14} color={theme.colors.foreground} />
                  </Pressable>
                  <AppText variant="micro" style={[styles.quantityLabel, { fontFamily: theme.fontFamilies.sansSemiBold }]}>
                    {item.quantity}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity of ${item.name}`}
                    onPress={() => setItemQuantity(item.id, item.quantity + 1)}
                    style={({ pressed }) => [
                      styles.iconButton,
                      { backgroundColor: theme.colors.muted, opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <Feather name="plus" size={14} color={theme.colors.foreground} />
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                  onPress={() => deletePackingItem(item.id)}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      backgroundColor: `${theme.colors.destructive}14`,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Feather name="trash-2" size={15} color={theme.colors.destructive} />
                </Pressable>
              </>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Packing item settings for ${item.name}`}
              onPress={() => setSettingsVisible(true)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.colors.muted, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Feather name="more-horizontal" size={18} color={theme.colors.foreground} />
            </Pressable>
          </View>
        </View>
      </View>

      <PackingItemSettingsSheet
        key={settingsVisible ? `${item.id}-open` : `${item.id}-closed`}
        item={item}
        travelers={travelers}
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  buyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownerBadge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  noteText: {
    flex: 1,
    lineHeight: 16,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quantityLabel: {
    minWidth: 14,
    textAlign: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
