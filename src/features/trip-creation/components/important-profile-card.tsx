import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppTextInput } from '@/components/ui/field';
import { AppText } from '@/components/ui/app-text';
import { importantProfileCardMetadata } from '@/domain/important-profile-setup';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import type { PackingProfile } from '@/domain/packing-profile';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import { useTheme } from '@/hooks/use-theme';

const PREVIEW_ITEM_LIMIT = 3;

type ImportantProfileCardProps = {
  profile: PackingProfile;
  config: ImportantItemsConfig;
  stagedRows: string[];
  expanded: boolean;
  onChangeRows: (rows: string[]) => void;
  onExpand: () => void;
  onConfigureLater: () => void;
};

export function ImportantProfileCard({
  profile,
  config,
  stagedRows,
  expanded,
  onChangeRows,
  onExpand,
  onConfigureLater,
}: ImportantProfileCardProps) {
  const theme = useTheme();
  const profileLabel = formatPackingListProfileName(profile);
  const isConfigured = config.isConfigured;
  const isDismissed = config.promptDismissed;
  const showCompactReview = isConfigured || isDismissed;
  const metadataLabel = importantProfileCardMetadata(config);
  const previewNames = stagedRows.map((row) => row.trim()).filter(Boolean);
  const visiblePreviewNames = previewNames.slice(0, PREVIEW_ITEM_LIMIT);
  const hiddenPreviewCount = Math.max(previewNames.length - visiblePreviewNames.length, 0);
  const showOnboardingActions = !isConfigured && !isDismissed && !expanded;
  const showEditInHeader = (showCompactReview || previewNames.length > 0) && !expanded;

  const updateRow = (index: number, value: string) => {
    onChangeRows(stagedRows.map((row, rowIndex) => (rowIndex === index ? value : row)));
  };

  const addRow = () => {
    onChangeRows([...stagedRows, '']);
  };

  const removeRow = (index: number) => {
    if (stagedRows.length === 1) {
      onChangeRows(['']);
      return;
    }

    onChangeRows(stagedRows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <AppText variant="bodySemiBold" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
            {profileLabel}
          </AppText>
          <AppText variant="caption" color="mutedForeground">
            {metadataLabel}
          </AppText>
        </View>
        {showEditInHeader ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit Important items for ${profileLabel}`}
            onPress={onExpand}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              Edit
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {!expanded && visiblePreviewNames.length > 0 ? (
        <View style={styles.itemList}>
          {visiblePreviewNames.map((name, index) => (
            <AppText key={`${profile.id}-preview-${index}`} variant="bodySmall" color="mutedForeground">
              {name}
            </AppText>
          ))}
          {hiddenPreviewCount > 0 ? (
            <AppText variant="caption" color="mutedForeground">
              +{hiddenPreviewCount} more
            </AppText>
          ) : null}
        </View>
      ) : null}

      {!isConfigured && !expanded ? (
        showOnboardingActions ? (
          <View style={styles.unconfiguredActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add Important items for ${profileLabel}`}
              onPress={onExpand}
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
              <Feather name="plus" size={16} color={theme.colors.primary} />
              <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Add important items
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Configure Important for ${profileLabel} later`}
              onPress={onConfigureLater}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
              <AppText variant="bodySmall" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Configure later
              </AppText>
            </Pressable>
          </View>
        ) : null
      ) : null}

      {expanded ? (
        <View style={styles.editor}>
          <View style={styles.rows}>
            {stagedRows.map((row, index) => (
              <View key={`important-row-${profile.id}-${index}`} style={styles.row}>
                <AppTextInput
                  value={row}
                  onChangeText={(value) => updateRow(index, value)}
                  placeholder={index === 0 ? 'e.g. Teddy bear' : 'Add another item'}
                  accessibilityLabel={`Important item ${index + 1} for ${profileLabel}`}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove item ${index + 1}`}
                  onPress={() => removeRow(index)}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                  <Feather name="minus-circle" size={20} color={theme.colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add another important item"
            onPress={addRow}
            style={({ pressed }) => [styles.addRowButton, pressed && styles.pressed]}>
            <Feather name="plus" size={16} color={theme.colors.primary} />
            <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              Add item
            </AppText>
          </Pressable>

          {!isConfigured && !isDismissed ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Configure Important for ${profileLabel} later`}
              onPress={onConfigureLater}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
              <AppText variant="bodySmall" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Configure later
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  itemList: {
    gap: 4,
  },
  unconfiguredActions: {
    gap: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  secondaryAction: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  editor: {
    gap: 10,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
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
  pressed: {
    opacity: 0.85,
  },
});
