import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
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
import { Chip } from '@/components/ui/chip';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  filterKnownTripContextTags,
  findTripContextTag,
  isKnownTripContextTag,
  normalizeTripContextTag,
  tripContextIncludes,
  tripContextTagKey,
} from '@/domain/trip-context-tags';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

type AddTripTagsSheetProps = {
  visible: boolean;
  selectedTags: string[];
  onClose: () => void;
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
};

export function AddTripTagsSheet({
  visible,
  selectedTags,
  onClose,
  onToggleTag,
  onAddCustomTag,
}: AddTripTagsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tagQuery, setTagQuery] = useState('');

  const trimmedQuery = normalizeTripContextTag(tagQuery);

  const filteredTags = useMemo(() => {
    const matches = filterKnownTripContextTags(tagQuery);
    return matches.filter((tag) => !tripContextIncludes(selectedTags, tag));
  }, [tagQuery, selectedTags]);

  const duplicateTag = useMemo(
    () => (trimmedQuery ? findTripContextTag(selectedTags, trimmedQuery) : undefined),
    [selectedTags, trimmedQuery],
  );

  const canAddQuery =
    trimmedQuery.length > 0 &&
    !duplicateTag &&
    !tripContextIncludes(selectedTags, trimmedQuery) &&
    !isKnownTripContextTag(trimmedQuery);

  const handleClose = () => {
    setTagQuery('');
    onClose();
  };

  const handleAddQuery = () => {
    if (!trimmedQuery || duplicateTag || tripContextIncludes(selectedTags, trimmedQuery)) {
      return;
    }

    const exactCatalogMatch = filteredTags.find(
      (tag) => tripContextTagKey(tag) === tripContextTagKey(trimmedQuery),
    );

    if (exactCatalogMatch) {
      onToggleTag(exactCatalogMatch);
      setTagQuery('');
      return;
    }

    if (canAddQuery) {
      onAddCustomTag(trimmedQuery);
      setTagQuery('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
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
            Add tags
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          keyboardShouldPersistTaps="handled">
          {selectedTags.length > 0 ? (
            <View style={styles.block}>
              <AppText variant="sectionLabel" color="mutedForeground">
                Selected
              </AppText>
              <View style={styles.chips}>
                {selectedTags.map((tag) => (
                  <Chip key={tag} label={tag} selected onPress={() => onToggleTag(tag)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.block}>
            <AppText variant="sectionLabel" color="mutedForeground">
              Search or add tags
            </AppText>
            <AppTextInput
              value={tagQuery}
              onChangeText={setTagQuery}
              placeholder="Search or add tags"
              onSubmitEditing={handleAddQuery}
              returnKeyType="done"
              accessibilityLabel="Search or add trip tags"
              style={styles.searchInput}
            />
            {filteredTags.length > 0 ? (
              <>
                <AppText variant="sectionLabel" color="mutedForeground">
                  Matching tags
                </AppText>
                <View style={styles.chips}>
                  {filteredTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      selected={tripContextIncludes(selectedTags, tag)}
                      onPress={() => {
                        onToggleTag(tag);
                        setTagQuery('');
                      }}
                    />
                  ))}
                </View>
              </>
            ) : trimmedQuery ? (
              <AppText variant="caption" color="mutedForeground">
                No matching tags
              </AppText>
            ) : null}
            {canAddQuery ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${trimmedQuery}`}
                onPress={handleAddQuery}
                style={styles.searchAddAction}>
                <Feather name="plus" size={14} color={theme.colors.primary} />
                <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                  Add &quot;{trimmedQuery}&quot;
                </AppText>
              </Pressable>
            ) : duplicateTag ? (
              <AppText variant="caption" color="destructive">
                This tag is already added.
              </AppText>
            ) : null}
          </View>
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
          <PrimaryButton label="Done" onPress={handleClose} />
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
    gap: 20,
  },
  block: {
    gap: 10,
  },
  searchInput: {
    borderRadius: 9999,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchAddAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  footer: {
    paddingHorizontal: screenPaddingHorizontal,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
