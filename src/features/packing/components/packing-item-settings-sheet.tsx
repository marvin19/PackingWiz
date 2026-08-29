import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
import { PrimaryButton } from '@/components/ui/primary-button';
import { isImportantPackingItem } from '@/domain/important-snapshot';
import type { PackingItem } from '@/domain/packing-item';
import {
  canSavePackingItemSettings,
  hasPackingItemSettingsChanges,
  normalizePackingItemSettingsInput,
} from '@/domain/packing-item-settings';
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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {visible ? (
        <PackingItemSettingsSheetBody
          key={item.id}
          item={item}
          travelers={travelers}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

function PackingItemSettingsSheetBody({
  item,
  travelers,
  onClose,
}: Omit<PackingItemSettingsSheetProps, 'visible'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { updatePackingItemSettings, deletePackingItem } = useTrips();

  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [needToBuy, setNeedToBuy] = useState(item.needToBuy);
  const [assignedTo, setAssignedTo] = useState<string | null>(item.assignedTo);
  const [note, setNote] = useState(item.note ?? '');
  const [nameFocused, setNameFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  const isImportant = isImportantPackingItem(item);
  const showAssign = travelers.length > 1;

  const stagedSettings = useMemo(
    () =>
      normalizePackingItemSettingsInput({
        name,
        quantity,
        needToBuy,
        assignedTo,
        note,
      }),
    [assignedTo, name, needToBuy, note, quantity],
  );

  const hasChanges = hasPackingItemSettingsChanges(item, stagedSettings);
  const canUpdate = canSavePackingItemSettings(item, stagedSettings);

  const handleClose = () => {
    onClose();
  };

  const handleUpdate = () => {
    if (!canUpdate) {
      return;
    }

    const saved = updatePackingItemSettings(item.id, stagedSettings);
    if (saved) {
      Keyboard.dismiss();
      onClose();
    }
  };

  const handleDelete = () => {
    deletePackingItem(item.id);
    onClose();
  };

  return (
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

        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
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
              <AppTextInput
                value={name}
                onChangeText={setName}
                placeholder="Item name"
                focused={nameFocused}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
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
                disabled={quantity <= 1}
                onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: theme.colors.muted,
                    opacity: quantity <= 1 ? 0.35 : 1,
                  },
                ]}>
                <Feather name="minus" size={14} color={theme.colors.foreground} />
              </Pressable>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold, minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.name}`}
                onPress={() => setQuantity((current) => current + 1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.muted }]}>
                <Feather name="plus" size={14} color={theme.colors.foreground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: needToBuy }}
            accessibilityLabel={
              needToBuy
                ? `Mark ${item.name} as not need to buy`
                : `Mark ${item.name} as need to buy`
            }
            onPress={() => setNeedToBuy((current) => !current)}
            style={[
              styles.toggleRow,
              {
                backgroundColor: needToBuy ? `${theme.colors.buy}26` : theme.colors.muted,
                borderColor: theme.colors.border,
              },
            ]}>
            <Feather name="shopping-bag" size={16} color={theme.colors.buyForeground} />
            <AppText variant="bodySmall" style={{ flex: 1, fontFamily: theme.fontFamilies.sansMedium }}>
              Need to buy
            </AppText>
            <Feather
              name={needToBuy ? 'check-circle' : 'circle'}
              size={18}
              color={needToBuy ? theme.colors.buyForeground : theme.colors.mutedForeground}
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
                  itemName={item.name}
                  active={!assignedTo}
                  onPress={() => setAssignedTo(null)}
                />
                {travelers.map((traveler) => (
                  <AssignChip
                    key={traveler.id}
                    label={traveler.name}
                    itemName={item.name}
                    active={assignedTo === traveler.id}
                    onPress={() => setAssignedTo(traveler.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {!isImportant ? (
            <View style={styles.fieldBlock}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Personal note
              </AppText>
              <AppTextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional details, e.g. colors or variants"
                focused={noteFocused}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                multiline
                accessibilityLabel="Personal item note"
              />
              <AppText variant="caption" color="mutedForeground" style={styles.helperCopy}>
                Optional — helpful when quantity covers multiple variants.
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Update item"
            onPress={handleUpdate}
            disabled={!canUpdate}
          />
          {!hasChanges && !canUpdate ? (
            <AppText variant="caption" color="mutedForeground" style={styles.footerHint}>
              No changes to save.
            </AppText>
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
      </View>
    </KeyboardAvoidingView>
  );
}

function AssignChip({
  label,
  itemName,
  active,
  onPress,
}: {
  label: string;
  itemName: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const assignmentTarget = label === 'Shared' ? 'shared' : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        active
          ? `${itemName} assigned to ${assignmentTarget}`
          : `Assign ${itemName} to ${assignmentTarget}`
      }
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
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
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
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  fieldBlock: {
    gap: 8,
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
  footer: {
    gap: 10,
    paddingTop: 12,
  },
  footerHint: {
    textAlign: 'center',
    lineHeight: 16,
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
