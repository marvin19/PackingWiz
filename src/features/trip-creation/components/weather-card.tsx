import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { TripWeather } from '@/domain/weather';
import { tripDetailCardStyles } from '@/features/trip-creation/components/trip-detail-card-styles';
import { getPrimaryWeatherIcon, getWeatherFeatherIcon } from '@/features/trip-creation/utils/weather-icons';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/spacing';

type WeatherCardProps = {
  weather: TripWeather | null;
  isLoading?: boolean;
};

export function WeatherCard({ weather, isLoading = false }: WeatherCardProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={[
          tripDetailCardStyles.card,
          styles.loadingCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <ActivityIndicator color={theme.colors.primary} />
        <AppText variant="bodySmall" color="mutedForeground">
          Loading weather preview…
        </AppText>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  const isForecast = weather.mode === 'forecast';
  const headerIcon = getWeatherFeatherIcon(getPrimaryWeatherIcon(weather));

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
          <Feather name={headerIcon} size={20} color={theme.colors.primary} />
          <View style={styles.headerCopy}>
            <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
              {weather.summary}
            </AppText>
            <AppText variant="caption" color="mutedForeground">
              {isForecast ? 'Forecast' : 'Typical weather'}
            </AppText>
          </View>
        </View>
        <AppText variant="bodySemiBold" color="primary" style={styles.temperature}>
          {weather.high}° / {weather.low}°
        </AppText>
      </View>

      <View style={tripDetailCardStyles.body}>
        {weather.detail ? (
          <AppText variant="bodySmall" color="mutedForeground" style={styles.detail}>
            {weather.detail}
          </AppText>
        ) : null}

        {!isForecast && weather.rainfall ? (
          <AppText variant="caption" color="mutedForeground" style={styles.meta}>
            Rainfall: {weather.rainfall}
          </AppText>
        ) : null}

        {!isForecast && weather.conditions ? (
          <AppText variant="caption" color="mutedForeground" style={styles.meta}>
            {weather.conditions}
          </AppText>
        ) : null}

        {isForecast && weather.days && weather.days.length > 0 ? (
          <View style={styles.dayStrip}>
            {weather.days.map((day) => (
              <View key={day.label} style={styles.dayColumn}>
                <AppText variant="micro" color="mutedForeground" style={{ fontFamily: theme.fontFamilies.sansMedium }}>
                  {day.label}
                </AppText>
                <Feather name={getWeatherFeatherIcon(day.icon)} size={20} color={theme.colors.primary} />
                <AppText variant="micro" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                  {day.high}°
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  detail: {
    lineHeight: 20,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  temperature: {
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  meta: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
