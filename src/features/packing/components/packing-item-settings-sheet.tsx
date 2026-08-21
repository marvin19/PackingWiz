import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type PackingItemSettingsSheetProps = {
  item: PackingItem;
  travelers: Traveler[];
  visible: boolean;
  onClose: () => void;
};

export function PackingItemSettingsSheet({
  item,
  travelers,
  visible,
  onClose,
}: PackingItemSettingsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    renamePackingItem,
    setItemQuantity,
    toggleNeedToBuy,
    assignItem,
    deletePackingItem,
  } = useTrips();

  const [name, setName] = useState(item.name);
  const [nameFocused, setNameFocused] = useState(false);

  const isImportant = isImportantPackingItem(item);
  const showAssign = travelers.length > 1;
  const trimmedName = name.trim();
  const canConfirmRename = !isImportant && trimmedName.length > 0 && trimmedName !== item.name;

  const handleClose = () => {
    onClose();
  };

  const handleConfirmRename = () => {
    if (!canConfirmRename) {
      return;
    }

    renamePackingItem(item.id, trimmedName);
    Keyboard.dismiss();
  };

  const handleDelete = () => {
    deletePackingItem(item.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close item settings"
          onPress={handleClose}
          style={styles.scrim}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, theme.spacing.base),
            },
          ]}>
          <View style={styles.sheetHeader}>
            <AppText variant="bodySemiBold" numberOfLines={1} style={styles.sheetTitle}>
              Item settings
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close item settings"
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: theme.colors.muted }]}>
              <Feather name="x" size={16} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="sectionLabel" color="mutedForeground">
              Name
            </AppText>
            {isImportant ? (
              <>
                <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                  {item.name}
                </AppText>
                <AppText variant="caption" color="mutedForeground" style={styles.helperCopy}>
                  Important items are managed in Profile.
                </AppText>
              </>
            ) : (
              <View style={styles.renameRow}>
                <View style={styles.renameInputWrap}>
                  <AppTextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Item name"
                    focused={nameFocused}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirmRename}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm rename to ${trimmedName || item.name}`}
                  accessibilityState={{ disabled: !canConfirmRename }}
                  disabled={!canConfirmRename}
                  onPress={handleConfirmRename}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    {
                      backgroundColor: canConfirmRename ? theme.colors.primary : theme.colors.muted,
                      opacity: !canConfirmRename ? 0.45 : pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Feather
                    name="check"
                    size={18}
                    color={canConfirmRename ? theme.colors.primaryForeground : theme.colors.mutedForeground}
                  />
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="sectionLabel" color="mutedForeground">
              Quantity
            </AppText>
            <View style={styles.quantityRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${item.name}`}
                disabled={item.quantity <= 1}
                onPress={() => setItemQuantity(item.id, item.quantity - 1)}
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: theme.colors.muted,
                    opacity: item.quantity <= 1 ? 0.35 : 1,
                  },
                ]}>
                <Feather name="minus" size={14} color={theme.colors.foreground} />
              </Pressable>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold, minWidth: 24, textAlign: 'center' }}>
                {item.quantity}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.name}`}
                onPress={() => setItemQuantity(item.id, item.quantity + 1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.muted }]}>
                <Feather name="plus" size={14} color={theme.colors.foreground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: item.needToBuy }}
            accessibilityLabel="Need to buy"
            onPress={() => toggleNeedToBuy(item.id)}
            style={[
              styles.toggleRow,
              {
                backgroundColor: item.needToBuy ? `${theme.colors.buy}26` : theme.colors.muted,
                borderColor: theme.colors.border,
              },
            ]}>
            <Feather name="shopping-bag" size={16} color={theme.colors.buyForeground} />
            <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
              Need to buy
            </AppText>
            <Feather
              name={item.needToBuy ? 'check-circle' : 'circle'}
              size={18}
              color={item.needToBuy ? theme.colors.buyForeground : theme.colors.mutedForeground}
            />
          </Pressable>

          {showAssign ? (
            <View style={styles.fieldBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Assign to
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <AssignChip
                  label="Shared"
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
              </ScrollView>
            </View>
          ) : null}

          {isImportant ? (
            <AppText variant="caption" color="mutedForeground" style={styles.helperCopy}>
              To remove this item from future trips, update Important items in Profile.
            </AppText>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              onPress={handleDelete}
              style={[styles.deleteButton, { backgroundColor: `${theme.colors.destructive}14` }]}>
              <Feather name="trash-2" size={16} color={theme.colors.destructive} />
              <AppText variant="bodySmall" style={{ color: theme.colors.destructive, fontFamily: theme.fontFamilies.sansSemiBold }}>
                Delete item
              </AppText>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: {
    gap: 8,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  confirmButton: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  helperCopy: {
    lineHeight: 18,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipRow: {
    gap: 8,
  },
  assignChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
});
