import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { formatImportantUpdatedAt } from '@/domain/dates';
import { dedupeImportantItemNames } from '@/domain/important-items-preferences';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type ImportantItemsSetupSheetProps = {
  visible: boolean;
  profileLabel?: string;
  initialNames?: string[];
  isConfigured?: boolean;
  isEnabled?: boolean;
  updatedAt?: string | null;
  onEnabledChange?: (enabled: boolean) => void;
  onClose: () => void;
  onSave: (names: string[]) => void;
};

function createEmptyDraftRow(): string {
  return '';
}

function draftRowsFromInitialNames(initialNames?: string[]): string[] {
  const names = (initialNames ?? []).map((name) => name.trim()).filter(Boolean);
  return names.length > 0 ? names : [createEmptyDraftRow()];
}

export function ImportantItemsSetupSheet({
  visible,
  profileLabel,
  initialNames,
  isConfigured = false,
  isEnabled = true,
  updatedAt,
  onEnabledChange,
  onClose,
  onSave,
}: ImportantItemsSetupSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<string[]>(() => draftRowsFromInitialNames(initialNames));

  const isEditing = isConfigured || (initialNames?.length ?? 0) > 0;
  const isEmptyConfigured = isConfigured && (initialNames?.length ?? 0) === 0;
  const showEnabledToggle = isConfigured && onEnabledChange;
  const editingDisabled = showEnabledToggle && !isEnabled;

  const loadDraft = () => {
    setRows(draftRowsFromInitialNames(initialNames));
  };

  const updateRow = (index: number, value: string) => {
    if (editingDisabled) {
      return;
    }

    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? value : row)));
  };

  const addRow = () => {
    if (editingDisabled) {
      return;
    }

    setRows((current) => [...current, createEmptyDraftRow()]);
  };

  const removeRow = (index: number) => {
    if (editingDisabled) {
      return;
    }

    setRows((current) => {
      if (current.length === 1) {
        return [createEmptyDraftRow()];
      }
      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleClose = () => {
    loadDraft();
    onClose();
  };

  const handleSave = () => {
    if (editingDisabled) {
      onClose();
      return;
    }

    const names = dedupeImportantItemNames(rows);
    onSave(names);
    onClose();
  };

  const title = profileLabel ? `Important for ${profileLabel}` : 'Important items';
  const updatedLabel = updatedAt ? formatImportantUpdatedAt(updatedAt) : '';

  const introCopy = (() => {
    if (editingDisabled) {
      return 'Important is currently turned off. Items saved here won\u2019t be added to new packing lists until you turn it back on. Your Important items are still saved, but editing is disabled while this feature is off.';
    }

    if (isEmptyConfigured) {
      return 'Your Important list is empty. Add items anytime — new trips will start without Important items until you add them.';
    }

    if (isEditing) {
      return 'Update personal must-haves for this person. Existing trips keep their current list until you choose to sync.';
    }

    return profileLabel
      ? `These personal must-haves will be added to ${profileLabel}'s packing lists automatically.`
      : 'These personal must-haves will be added to every new packing list automatically.';
  })();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      onShow={loadDraft}>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16),
              borderBottomColor: theme.colors.border,
            },
          ]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={handleClose} hitSlop={8}>
            <Feather name="x" size={22} color={theme.colors.foreground} />
          </Pressable>
          <AppText variant="bodySemiBold" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
            {title}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          keyboardShouldPersistTaps="handled">
          {showEnabledToggle ? (
            <View style={[styles.toggleRow, { borderColor: theme.colors.border }]}>
              <View style={styles.toggleCopy}>
                <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                  Include Important in packing lists
                </AppText>
                <AppText variant="caption" color="mutedForeground">
                  {isEnabled
                    ? 'New trips include your saved Important items'
                    : 'Saved items stay here but won\u2019t be added to new trips'}
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Include Important in packing lists"
                value={isEnabled}
                onValueChange={onEnabledChange}
                trackColor={{
                  false: theme.colors.muted,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.background}
                ios_backgroundColor={theme.colors.muted}
              />
            </View>
          ) : null}

          <AppText variant="bodySmall" color="mutedForeground" style={styles.intro}>
            {introCopy}
          </AppText>

          {updatedLabel ? (
            <AppText variant="caption" color="mutedForeground">
              {updatedLabel}
            </AppText>
          ) : null}

          <View style={[styles.rows, editingDisabled && styles.rowsDisabled]}>
            {rows.map((row, index) => (
              <View key={`important-row-${index}`} style={styles.row}>
                <AppTextInput
                  value={row}
                  onChangeText={(value) => updateRow(index, value)}
                  placeholder={index === 0 ? 'e.g. Insulin' : 'Add another item'}
                  accessibilityLabel={`Important item ${index + 1}`}
                  editable={!editingDisabled}
                  style={[styles.input, editingDisabled && styles.inputDisabled]}
                />
                {!editingDisabled ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove item ${index + 1}`}
                    onPress={() => removeRow(index)}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                    <Feather name="minus-circle" size={20} color={theme.colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          {!editingDisabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add another important item"
              onPress={addRow}
              style={({ pressed }) => [styles.addRowButton, pressed && styles.pressed]}>
              <Feather name="plus" size={16} color={theme.colors.primary} />
              <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Add another item
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}>
          <PrimaryButton
            label={editingDisabled ? 'Done' : 'Save important items'}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingHorizontal,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 16,
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  intro: {
    lineHeight: 20,
  },
  rows: {
    gap: 10,
  },
  rowsDisabled: {
    opacity: 0.72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
  },
  inputDisabled: {
    opacity: 0.85,
  },
  removeButton: {
    padding: 4,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  footer: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.85,
  },
});
