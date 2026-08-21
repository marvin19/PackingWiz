import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { tripFactCardStyles } from '@/features/trip-creation/components/trip-detail-card-styles';
import { useTheme } from '@/hooks/use-theme';

type TripFactProps = {
  icon: ReactNode;
  label: string;
  value: string;
  editAccessibilityLabel?: string;
  onEdit?: () => void;
};

export function TripFact({ icon, label, value, editAccessibilityLabel, onEdit }: TripFactProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        tripFactCardStyles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={tripFactCardStyles.row}>
        <View style={tripFactCardStyles.iconSlot}>{icon}</View>
        <View style={tripFactCardStyles.content}>
          <AppText
            variant="caption"
            color="mutedForeground"
            numberOfLines={1}
            style={[tripFactCardStyles.label, { fontFamily: theme.fontFamilies.sansMedium }]}>
            {label}
          </AppText>
          <AppText variant="bodySmall" numberOfLines={2} style={tripFactCardStyles.value}>
            {value}
          </AppText>
        </View>
        {onEdit && editAccessibilityLabel ? (
          <SummaryEditButton accessibilityLabel={editAccessibilityLabel} onPress={onEdit} compact />
        ) : null}
      </View>
    </View>
  );
}
