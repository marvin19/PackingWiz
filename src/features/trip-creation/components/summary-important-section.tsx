import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { profilesWithConfiguredImportant } from '@/domain/important-profile-setup';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import type { PackingProfile } from '@/domain/packing-profile';
import type { ImportantItemsByProfileId } from '@/domain/profile-important-items';
import { SummaryDetailCard } from '@/features/trip-creation/components/summary-detail-card';
import { useTheme } from '@/hooks/use-theme';

type SummaryImportantSectionProps = {
  profiles: PackingProfile[];
  importantByProfileId: ImportantItemsByProfileId;
  onEdit: () => void;
};

export function SummaryImportantSection({
  profiles,
  importantByProfileId,
  onEdit,
}: SummaryImportantSectionProps) {
  const theme = useTheme();
  const configured = profilesWithConfiguredImportant(profiles, importantByProfileId);

  if (configured.length === 0) {
    return null;
  }

  return (
    <SummaryDetailCard
      icon={<Feather name="alert-triangle" size={16} color={theme.colors.important} />}
      title="Important items"
      editAccessibilityLabel="Edit Important items"
      onEdit={onEdit}>
      <View style={styles.rows}>
        {configured.map(({ profile, itemCount }) => {
          const label = formatPackingListProfileName(profile);
          const countLabel =
            itemCount === 0
              ? 'None saved'
              : `${itemCount} saved ${itemCount === 1 ? 'item' : 'items'}`;

          return (
            <View key={profile.id} style={styles.row}>
              <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                {label}
              </AppText>
              <AppText variant="bodySmall" color="mutedForeground">
                {countLabel}
              </AppText>
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit Important items"
        onPress={onEdit}
        style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}>
        <AppText variant="caption" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
          Edit
        </AppText>
      </Pressable>
    </SummaryDetailCard>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.85,
  },
});
