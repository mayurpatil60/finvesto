// ─── Home Screen ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePushNotification } from '../../components/notifications/PushNotificationHandler';
import { useTheme } from '../../components/theme/ThemeProvider';
import { UserService } from '../../services/UserService';
import { SPACING } from '../../types/constants';
import type { UserModel } from '../../types/models/UserModel';
import { NotificationType } from '../../types/enums';

// ─── Test Notification Button ─────────────────────────────────────────────────
function TestNotificationButton() {
  const { sendLocalNotification, expoPushToken } = usePushNotification();
  const { theme } = useTheme();
  const c = theme.colors;

  const handlePress = () => {
    sendLocalNotification({
      title: '🚀 Finvesto Alert',
      body: 'Push notifications are working!',
      type: NotificationType.GENERAL,
      data: { screen: 'Home' },
    });
  };

  return (
    <View style={notifStyles.container}>
      <TouchableOpacity style={[notifStyles.button, { backgroundColor: c.primary }]} onPress={handlePress}>
        <Text style={[notifStyles.buttonText, { color: '#fff' }]}>Send Test Notification</Text>
      </TouchableOpacity>
      <Text style={[notifStyles.tokenLabel, { color: c.textSecondary }]} numberOfLines={2}>
        {expoPushToken ? `Token: ${expoPushToken}` : 'No push token (use a physical device)'}
      </Text>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  tokenLabel: {
    marginTop: SPACING.sm,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [user, setUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    UserService.getInstance()
      .getCurrentUser()
      .then((u) => { setUser(u); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.cardShadow }]}>
          <Text style={[styles.greeting, { color: c.text }]}>
            Hello, {user?.getDisplayName() ?? 'User'} 👋
          </Text>
          <Text style={[styles.subtext, { color: c.primary }]}>Welcome to Finvesto</Text>
          <Text style={[styles.hint, { color: c.textSecondary }]}>More features coming soon…</Text>
          <TestNotificationButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: 13,
    marginTop: SPACING.md,
  },
});

