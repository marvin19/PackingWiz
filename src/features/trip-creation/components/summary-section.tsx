import { StyleSheet, View } from 'react-native';

import { SectionTitle } from '@/components/ui/section-title';

type SummarySectionProps = {
  title: string;
  children: React.ReactNode;
};

export function SummarySection({ title, children }: SummarySectionProps) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
});
