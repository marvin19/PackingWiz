import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionTitle } from '@/components/ui/section-title';
import { SettingsCard, SettingsDivider } from '@/components/ui/settings/settings-card';
import { SettingsLinkRow } from '@/components/ui/settings/settings-link-row';
import { SettingsToggleRow } from '@/components/ui/settings/settings-toggle-row';
import { ImportantItemsSetupSheet } from '@/features/packing/components/important-items-setup-sheet';
import { ProfileIdentityCard } from '@/features/profile/components/profile-identity-card';
import { ProfileStatCard } from '@/features/profile/components/profile-stat-card';
import {
  AddTravelerRow,
  TravelerProfileRow,
} from '@/features/profile/components/traveler-profile-row';
import { formatImportantUpdatedAt } from '@/domain/dates';
import { profileTravelStats } from '@/features/profile/utils/profile-stats';
import { useProfile } from '@/hooks/use-profile';
import { useTrips } from '@/hooks/use-trips';
import { useTheme } from '@/hooks/use-theme';
import { mockUserProfile } from '@/mocks/user-profile';
import { screenPaddingHorizontal } from '@/theme/spacing';

export function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { trips } = useTrips();
  const {
    preferences,
    savedTravelers,
    importantItems,
    isImportantConfigured,
    isImportantEnabled,
    importantUpdatedAt,
    setPreference,
    addSavedTraveler,
    saveImportantItems,
    setImportantEnabled,
    resetImportantPromptDismissed,
    consumeImportantEditorRequest,
  } = useProfile();

  const [importantSetupVisible, setImportantSetupVisible] = useState(false);

  const stats = useMemo(() => profileTravelStats(trips), [trips]);

  const metricHint = preferences.metricUnits ? 'Celsius, kilometers' : 'Fahrenheit, miles';

  const importantHint = useMemo(() => {
    if (!isImportantConfigured) {
      return 'Keep your personal must-haves on every packing list';
    }

    const countLabel =
      importantItems.length === 0
        ? '0 items'
        : `${importantItems.length} ${importantItems.length === 1 ? 'item' : 'items'}`;

    if (!isImportantEnabled) {
      return `${countLabel} · Turned off`;
    }

    if (importantUpdatedAt) {
      return `${countLabel} · ${formatImportantUpdatedAt(importantUpdatedAt)}`;
    }

    return countLabel;
  }, [importantItems.length, importantUpdatedAt, isImportantConfigured, isImportantEnabled]);

  const importantInitialNames = useMemo(
    () => importantItems.map((item) => item.name),
    [importantItems],
  );

  const handleOpenImportantSetup = useCallback(() => {
    resetImportantPromptDismissed();
    setImportantSetupVisible(true);
  }, [resetImportantPromptDismissed]);

  useFocusEffect(
    useCallback(() => {
      if (consumeImportantEditorRequest()) {
        resetImportantPromptDismissed();
        setImportantSetupVisible(true);
      }
    }, [consumeImportantEditorRequest, resetImportantPromptDismissed]),
  );

  const handleSaveImportantItems = (names: string[]) => {
    saveImportantItems(names);
  };

  return (
    <AppScreen>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingHorizontal: screenPaddingHorizontal,
          },
        ]}>
        <AppText variant="title" style={{ fontFamily: theme.fontFamilies.displayExtraBold }}>
          Profile
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: screenPaddingHorizontal,
            paddingBottom: Math.max(insets.bottom, 24) + 88,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <ProfileIdentityCard profile={mockUserProfile} />

        <View style={styles.statsRow}>
          <ProfileStatCard
            value={String(stats.tripsPlanned)}
            label="trips planned"
            icon={<Feather name="navigation" size={16} color={theme.colors.primary} />}
          />
          <ProfileStatCard
            value={String(stats.itemsPacked)}
            label="items packed"
            icon={<Feather name="briefcase" size={16} color={theme.colors.primary} />}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle>Travelers</SectionTitle>
          <SettingsCard>
            {savedTravelers.map((traveler, index) => (
              <View key={traveler.id}>
                {index > 0 ? <SettingsDivider /> : null}
                <TravelerProfileRow traveler={traveler} />
              </View>
            ))}
            <SettingsDivider />
            <AddTravelerRow onPress={addSavedTraveler} />
          </SettingsCard>
        </View>

        <View style={styles.section}>
          <SectionTitle>Packing</SectionTitle>
          <SettingsCard>
            <SettingsLinkRow
              icon={<Feather name="alert-triangle" size={16} color={theme.colors.important} />}
              label="Important items"
              hint={importantHint}
              onPress={handleOpenImportantSetup}
            />
          </SettingsCard>
        </View>

        <View style={styles.section}>
          <SectionTitle>Packing preferences</SectionTitle>
          <SettingsCard>
            <SettingsToggleRow
              icon={<Feather name="zap" size={16} color={theme.colors.accentForeground} />}
              label="Smart quantities"
              hint="Let PackingWiz scale amounts to trip length"
              value={preferences.smartQuantities}
              onValueChange={(value) => setPreference('smartQuantities', value)}
            />
            <SettingsDivider />
            <SettingsToggleRow
              icon={<Feather name="sliders" size={16} color={theme.colors.accentForeground} />}
              label="Metric units"
              hint={metricHint}
              value={preferences.metricUnits}
              onValueChange={(value) => setPreference('metricUnits', value)}
            />
            <SettingsDivider />
            <SettingsToggleRow
              icon={<Feather name="bell" size={16} color={theme.colors.accentForeground} />}
              label="Packing reminders"
              hint="Coming soon — no notifications yet"
              value={preferences.packingReminders}
              onValueChange={(value) => setPreference('packingReminders', value)}
            />
          </SettingsCard>
        </View>

        <View style={styles.section}>
          <SectionTitle>General</SectionTitle>
          <SettingsCard>
            <SettingsLinkRow
              icon={<Feather name="globe" size={16} color={theme.colors.accentForeground} />}
              label="Language & region"
              hint="English (UK)"
            />
            <SettingsDivider />
            <SettingsLinkRow
              icon={<Feather name="briefcase" size={16} color={theme.colors.accentForeground} />}
              label="Default packing style"
              hint="Balanced"
            />
          </SettingsCard>
        </View>

        <View style={styles.section}>
          <SectionTitle>Settings</SectionTitle>
          <SettingsCard>
            <SettingsLinkRow
              icon={<Feather name="user" size={16} color={theme.colors.accentForeground} />}
              label="Account"
              hint="Sign in coming soon"
            />
            <SettingsDivider />
            <SettingsLinkRow
              icon={<Feather name="shield" size={16} color={theme.colors.accentForeground} />}
              label="Privacy"
            />
            <SettingsDivider />
            <SettingsLinkRow
              icon={<Feather name="help-circle" size={16} color={theme.colors.accentForeground} />}
              label="Help & Support"
            />
            <SettingsDivider />
            <SettingsLinkRow
              icon={<Feather name="info" size={16} color={theme.colors.accentForeground} />}
              label="About"
            />
          </SettingsCard>
        </View>

        <AppText variant="caption" color="mutedForeground" style={styles.footer}>
          PackingWiz · v1.0
        </AppText>
      </ScrollView>

      <ImportantItemsSetupSheet
        visible={importantSetupVisible}
        initialNames={importantInitialNames}
        isConfigured={isImportantConfigured}
        isEnabled={isImportantEnabled}
        onEnabledChange={setImportantEnabled}
        onClose={() => setImportantSetupVisible(false)}
        onSave={handleSaveImportantItems}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
  },
  scrollContent: {
    paddingTop: 8,
    gap: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    gap: 0,
  },
  footer: {
    textAlign: 'center',
    marginTop: 8,
  },
});
