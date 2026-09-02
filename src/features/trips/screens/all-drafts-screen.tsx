import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/navigation/screen-header';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { DraftPlanningList } from '@/features/trips/components/draft-planning-list';
import { useTripNavigation } from '@/hooks/use-trip-navigation';
import { useTrips } from '@/hooks/use-trips';
import { goBackOrReplace } from '@/lib/safe-navigation';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function AllDraftsScreen() {
  const insets = useSafeAreaInsets();
  const { inProgressDraftsOrdered, deleteDraft } = useTrips();
  const { resumeDraftTrip } = useTripNavigation();

  const handleBack = () => {
    goBackOrReplace('/(tabs)');
  };

  return (
    <AppScreen>
      <ScreenHeader title="Draft trips" onBack={handleBack} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: screenPaddingHorizontal,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {inProgressDraftsOrdered.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="bodySmall" color="mutedForeground" style={styles.emptyCopy}>
              No drafts in progress. Start planning a trip from the Trips tab.
            </AppText>
          </View>
        ) : (
          <DraftPlanningList
            drafts={inProgressDraftsOrdered}
            onResumeDraft={resumeDraftTrip}
            onDeleteDraft={deleteDraft}
          />
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
  },
  emptyState: {
    paddingTop: 24,
  },
  emptyCopy: {
    lineHeight: 20,
  },
});
