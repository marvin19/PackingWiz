import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import {
  TRIPS_BROWSE_FILTERS,
  tripsBrowseFilterLabel,
  type TripsBrowseFilter,
} from '@/features/trips/utils/trips-browse-filter';
import { useTheme } from '@/hooks/use-theme';

type TripsBrowseFilterBarProps = {
  activeFilter: TripsBrowseFilter;
  onFilterChange: (filter: TripsBrowseFilter) => void;
};

export function TripsBrowseFilterBar({ activeFilter, onFilterChange }: TripsBrowseFilterBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {TRIPS_BROWSE_FILTERS.map((filter) => {
        const selected = activeFilter === filter;

        return (
          <Pressable
            key={filter}
            accessibilityRole="button"
            accessibilityLabel={tripsBrowseFilterLabel(filter)}
            accessibilityState={{ selected }}
            onPress={() => onFilterChange(filter)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <AppText
              variant="bodySmall"
              numberOfLines={1}
              style={{
                color: selected ? theme.colors.primaryForeground : theme.colors.foreground,
                fontFamily: theme.fontFamilies.sansMedium,
                textAlign: 'center',
              }}>
              {tripsBrowseFilterLabel(filter)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
});
