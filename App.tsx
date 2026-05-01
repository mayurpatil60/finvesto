// ─── App Root ─────────────────────────────────────────────────────────────────
// Entry point — keep this thin; all logic lives in src/.

// ─── App Root ─────────────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { PushNotificationHandler } from './src/components/notifications/PushNotificationHandler';
import { ThemeProvider } from './src/components/theme/ThemeProvider';
import { AuthProvider } from './src/components/auth/AuthProvider';
import { ServerStatusBanner } from './src/components/common/ServerStatusBanner';
import { useAppUpdater } from './src/hooks/useAppUpdater';

function AppRoot() {
  useAppUpdater(); // check & apply OTA updates silently on launch

  return (
    <ThemeProvider>
      <AuthProvider>
        <PushNotificationHandler>
          <View style={styles.root}>
            <StatusBar style="auto" />
            <AppNavigator />
            <ServerStatusBanner />
          </View>
        </PushNotificationHandler>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default AppRoot;
