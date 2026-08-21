import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SummaryEditButton } from '@/features/trip-creation/components/summary-edit-button';
import { tripDetailCardStyles } from '@/features/trip-creation/components/trip-detail-card-styles';
import { useTheme } from '@/hooks/use-theme';

type SummaryDetailCardProps = {
  icon: ReactNode;
  title: string;
  editAccessibilityLabel?: string;
  onEdit?: () => void;
  children: ReactNode;
};

export function SummaryDetailCard({
  icon,
  title,
  editAccessibilityLabel,
  onEdit,
  children,
}: SummaryDetailCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        tripDetailCardStyles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[tripDetailCardStyles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={tripDetailCardStyles.headerTitle}>
          {icon}
          <AppText variant="bodySmall" numberOfLines={1} style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            {title}
          </AppText>
        </View>
        {onEdit && editAccessibilityLabel ? (
          <SummaryEditButton accessibilityLabel={editAccessibilityLabel} onPress={onEdit} compact />
        ) : null}
      </View>
      <View style={tripDetailCardStyles.body}>{children}</View>
    </View>
  );
}
