import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/theme/ThemeProvider';
import { AppHeader } from '../../components/layout/AppHeader';
import { SPACING } from '../../types/constants';
import { getNotificationHistory } from '../../services/notification/notification.service';
import { IRemoteNotification } from '../../types/interfaces';

export function NotificationHistoryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [notifications, setNotifications] = useState<IRemoteNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getNotificationHistory();
      setNotifications(res.notifications);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <AppHeader title="Notifications" />
        <View style={styles.centered}>
          <ActivityIndicator color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <AppHeader title="Notifications" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {error ?? 'No notifications yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.badge, { backgroundColor: c.primary + '22', color: c.primary }]}>
                {item.type}
              </Text>
            </View>
            <Text style={[styles.body, { color: c.textSecondary }]}>{item.body}</Text>
            <Text style={[styles.date, { color: c.textSecondary }]}>{formatDate(item.sentAt)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyText: { fontSize: 14 },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: SPACING.sm },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  body: { fontSize: 13, lineHeight: 20 },
  date: { fontSize: 11, marginTop: 4 },
});
