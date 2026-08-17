import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { TripWeather } from '@/domain/weather';
import { getWeatherFeatherIcon } from '@/features/trip-creation/utils/weather-icons';
import { useTheme } from '@/hooks/use-theme';

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
          styles.card,
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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTitle}>
          <Feather name="cloud-rain" size={16} color={theme.colors.primary} />
          <AppText variant="bodySmall" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
            {isForecast ? 'Forecast' : 'Typical weather'}
          </AppText>
        </View>
        <AppText variant="bodySmall" color="mutedForeground">
          {weather.high}° / {weather.low}°
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodySmall" color="mutedForeground" style={styles.detail}>
          {weather.detail}
        </AppText>

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
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detail: {
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    lineHeight: 18,
  },
  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 12,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});
