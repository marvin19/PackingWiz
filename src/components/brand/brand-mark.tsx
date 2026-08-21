import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 36 }: BrandMarkProps) {
  const theme = useTheme();
  const iconSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.primary,
        },
      ]}>
      <Feather name="compass" size={iconSize} color={theme.colors.primaryForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
