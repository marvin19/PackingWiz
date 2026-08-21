import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
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
  const { setItemQuantity, toggleNeedToBuy, deletePackingItem, assignItem } = useTrips();
  const [expanded, setExpanded] = useState(false);

  const assigned = travelers.find((traveler) => traveler.id === item.assignedTo);
  const showAssign = travelers.length > 1;
  const isPurchasedIntent = checkboxIntent === 'purchased';
  const checkboxChecked = isPurchasedIntent ? false : item.packed;
  const checkboxLabel = isPurchasedIntent
    ? `Mark ${item.name} as purchased`
    : item.packed
      ? `Mark ${item.name} as not packed`
      : `Mark ${item.name} as packed`;

  return (
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.quantity} items`}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
          style={styles.nameBlock}>
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
            {item.note && !item.needToBuy && !assigned ? (
              <View style={styles.noteHint}>
                <Feather name="info" size={11} color={theme.colors.mutedForeground} />
                <AppText variant="micro" color="mutedForeground">
                  Why this?
                </AppText>
              </View>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.quantityControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.name}`}
            disabled={item.quantity <= 1}
            onPress={() => setItemQuantity(item.id, item.quantity - 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              { backgroundColor: theme.colors.muted, opacity: item.quantity <= 1 ? 0.35 : pressed ? 0.85 : 1 },
            ]}>
            <Feather name="minus" size={14} color={theme.colors.foreground} />
          </Pressable>
          <AppText variant="bodySmall" style={[styles.quantity, { fontFamily: theme.fontFamilies.sansSemiBold }]}>
            {item.quantity}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.name}`}
            onPress={() => setItemQuantity(item.id, item.quantity + 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              { backgroundColor: theme.colors.muted, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Feather name="plus" size={14} color={theme.colors.foreground} />
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={[styles.expanded, { borderTopColor: theme.colors.border }]}>
          {item.note ? (
            <View style={[styles.noteBox, { backgroundColor: `${theme.colors.accent}66` }]}>
              <Feather name="info" size={14} color={theme.colors.primary} />
              <AppText variant="caption" color="accentForeground" style={styles.noteText}>
                {item.note}
              </AppText>
            </View>
          ) : null}

          {showAssign ? (
            <View style={styles.assignBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Assign to
              </AppText>
              <View style={styles.chipRow}>
                <AssignChip
                  label="Everyone"
                  active={!item.assignedTo}
                  onPress={() => assignItem(item.id, null)}
                />
                {travelers.map((traveler) => (
                  <AssignChip
                    key={traveler.id}
                    label={traveler.name}
                    active={item.assignedTo === traveler.id}
                    onPress={() => assignItem(item.id, traveler.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.needToBuy ? 'Remove from shopping list' : 'Mark as need to buy'}
              accessibilityState={{ selected: item.needToBuy }}
              onPress={() => toggleNeedToBuy(item.id)}
              style={[
                styles.buyAction,
                {
                  backgroundColor: item.needToBuy ? `${theme.colors.buy}33` : theme.colors.muted,
                },
              ]}>
              <Feather
                name="shopping-bag"
                size={14}
                color={item.needToBuy ? theme.colors.buyForeground : theme.colors.foreground}
              />
              <AppText
                variant="caption"
                style={{
                  fontFamily: theme.fontFamilies.sansSemiBold,
                  color: item.needToBuy ? theme.colors.buyForeground : theme.colors.foreground,
                }}>
                {item.needToBuy ? 'On shopping list' : 'Need to buy'}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
              onPress={() => deletePackingItem(item.id)}
              style={[styles.deleteButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="trash-2" size={16} color={theme.colors.destructive} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function AssignChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.assignChip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.card,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
      ]}>
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.fontFamilies.sansMedium,
          color: active ? theme.colors.primaryForeground : theme.colors.foreground,
        }}>
        {label}
      </AppText>
    </Pressable>
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
  noteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    width: 20,
    textAlign: 'center',
  },
  expanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteText: {
    flex: 1,
    lineHeight: 18,
  },
  assignBlock: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingVertical: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
