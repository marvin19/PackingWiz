import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { AppText } from '@/components/ui/app-text';

type WizardProgressProps = {
  step: number;
  totalSteps: number;
};

export function WizardProgress({ step, totalSteps }: WizardProgressProps) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <ProgressBar value={progress} accessibilityLabel={`Step ${step + 1} of ${totalSteps}`} />
      <AppText variant="caption" color="mutedForeground" style={styles.stepLabel}>
        Step {step + 1} of {totalSteps}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 4,
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
  },
});
