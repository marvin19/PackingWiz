import { StyleSheet, View } from 'react-native';

import { TripNameField } from '@/features/trip-creation/components/trip-name-field';
import type { TripDraft } from '@/domain/trip-draft';

type TripNameStepProps = {
  draft: TripDraft;
  onChangeName: (name: string) => void;
};

export function TripNameStep({ draft, onChangeName }: TripNameStepProps) {
  return (
    <View style={styles.container}>
      <TripNameField draft={draft} onChangeName={onChangeName} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
