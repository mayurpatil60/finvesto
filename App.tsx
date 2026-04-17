// ─── App Root ─────────────────────────────────────────────────────────────────
// Entry point — keep this thin; all logic lives in src/.

// ─── App Root ─────────────────────────────────────────────────────────────────

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { PushNotificationHandler } from './src/components/notifications/PushNotificationHandler';
import { ThemeProvider } from './src/components/theme/ThemeProvider';
import { useAppUpdater } from './src/hooks/useAppUpdater';

function AppRoot() {
  useAppUpdater(); // check & apply OTA updates silently on launch

  return (
    <ThemeProvider>
      <PushNotificationHandler>
        <StatusBar style="auto" />
        <AppNavigator />
      </PushNotificationHandler>
    </ThemeProvider>
  );
}

export default AppRoot;
