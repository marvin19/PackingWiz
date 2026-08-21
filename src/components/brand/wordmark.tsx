import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand/brand-mark';
import { AppText } from '@/components/ui/app-text';

type WordmarkProps = {
  showName?: boolean;
};

export function Wordmark({ showName = false }: WordmarkProps) {
  return (
    <View style={styles.row}>
      <BrandMark />
      {showName ? (
        <AppText variant="title" style={styles.name}>
          Trove
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    letterSpacing: -0.3,
  },
});
