import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Bag } from '@/domain/bag';
import type { Traveler } from '@/domain/traveler';
import { getBagIcon } from '@/features/trip-creation/utils/catalog-icons';
import { useTheme } from '@/hooks/use-theme';

type OverviewBagRowProps = {
  bag: Bag;
  travelers: Traveler[];
};

export function OverviewBagRow({ bag, travelers }: OverviewBagRowProps) {
  const theme = useTheme();
  const bagIcon = getBagIcon(bag.type);
  const owner = bag.ownerId ? travelers.find((traveler) => traveler.id === bag.ownerId) : null;
  const ownerLabel = owner?.name ?? 'Shared';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent }]}>
        <Feather name={bagIcon} size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
          {bag.name}
        </AppText>
        <AppText variant="caption" color="mutedForeground">
          {ownerLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
