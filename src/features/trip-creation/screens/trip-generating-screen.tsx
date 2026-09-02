import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getDestinationLabel } from '@/domain/destination';
import { GeneratingStep } from '@/features/trip-creation/components/generating-step';
import { getGenerationStepStatus } from '@/features/trip-creation/constants/generation';
import { useTripGeneration } from '@/features/trip-creation/hooks/use-trip-generation';
import { useTrips } from '@/hooks/use-trips';
import { blurActiveElement } from '@/lib/blur-active-element';
import { useTheme } from '@/hooks/use-theme';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function TripGeneratingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { draft, acknowledgeCommitDraftNavigation } = useTrips();
  const [destinationLabel] = useState(() => getDestinationLabel(draft.destination));
  const { activeStep, status, errorMessage, steps, start, retry, isReadyToFinish, finishDelayMs } =
    useTripGeneration();

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!isReadyToFinish) {
      return;
    }

    const timer = setTimeout(() => {
      blurActiveElement();
      router.replace('/(tabs)/pack');
      acknowledgeCommitDraftNavigation();
    }, finishDelayMs);

    return () => clearTimeout(timer);
  }, [acknowledgeCommitDraftNavigation, finishDelayMs, isReadyToFinish, router]);

  const handleBackToSummary = () => {
    blurActiveElement();
    router.replace('/trip/summary');
  };

  if (status === 'error') {
    return (
      <AppScreen style={[styles.screen, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.errorContent}>
          <View style={[styles.errorIcon, { backgroundColor: theme.colors.destructive }]}>
            <Feather name="alert-circle" size={28} color={theme.colors.primaryForeground} />
          </View>
          <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold, textAlign: 'center' }}>
            Couldn&apos;t build your list
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.errorMessage}>
            {errorMessage ?? 'Something went wrong while generating your packing list.'}
          </AppText>
          <View style={styles.errorActions}>
            <PrimaryButton label="Try again" onPress={retry} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to trip summary"
              onPress={handleBackToSummary}
              style={styles.secondaryAction}>
              <AppText variant="bodySmall" color="primary" style={{ fontFamily: theme.fontFamilies.sansSemiBold }}>
                Back to summary
              </AppText>
            </Pressable>
          </View>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={[styles.screen, { paddingHorizontal: screenPaddingHorizontal }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroRings}>
            <View style={[styles.ringOuter, { backgroundColor: `${theme.colors.primary}26` }]} />
            <View style={[styles.ringInner, { backgroundColor: `${theme.colors.primary}1A` }]} />
            <View style={[styles.heroIcon, { backgroundColor: theme.colors.primary }]}>
              <Feather name="star" size={28} color={theme.colors.primaryForeground} />
            </View>
          </View>

          <AppText variant="title" style={[styles.title, { fontFamily: theme.fontFamilies.displayExtraBold }]}>
            Building your list for {destinationLabel || 'your trip'}
          </AppText>
          <AppText variant="bodySmall" color="mutedForeground" style={styles.subtitle}>
            Trove is tailoring every item to this trip.
          </AppText>
        </View>

        <View style={styles.steps}>
          {steps.map((label, index) => (
            <GeneratingStep
              key={label}
              label={label}
              status={getGenerationStepStatus(index, activeStep)}
            />
          ))}
        </View>

        {status === 'running' ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  heroRings: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ringOuter: {
    ...StyleSheet.absoluteFill,
    borderRadius: 9999,
  },
  ringInner: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
    borderRadius: 9999,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  steps: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  spinner: {
    marginTop: 24,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPaddingHorizontal,
    gap: 12,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
