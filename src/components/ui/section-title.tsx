import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';

type SectionTitleProps = {
  children: string;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <AppText variant="sectionLabel" color="mutedForeground" style={styles.title}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});
