import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../components/theme/ThemeProvider';
import { AppHeader } from '../../components/layout/AppHeader';
import { SPACING } from '../../types/constants';
import {
  clearAllNotifications,
  deleteNotification,
  getNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notification/notification.service';
import { useAuth } from '../../components/auth/AuthProvider';
import { IRemoteNotification } from '../../types/interfaces';

export function NotificationHistoryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const userId = user?._id ?? user?.id ?? '';

  const [notifications, setNotifications] = useState<IRemoteNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(
    (n) => !(n.readBy ?? []).includes(userId),
  ).length;

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

  function isRead(n: IRemoteNotification): boolean {
    return (n.readBy ?? []).includes(userId);
  }

  async function handleMarkRead(n: IRemoteNotification) {
    if (isRead(n)) return;
    try {
      await markNotificationRead(n._id);
      setNotifications((prev) =>
        prev.map((x) =>
          x._id === n._id ? { ...x, readBy: [...(x.readBy ?? []), userId] } : x,
        ),
      );
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((x) => ({ ...x, readBy: [...new Set([...(x.readBy ?? []), userId])] })),
      );
    } catch {}
  }

  async function handleDelete(n: IRemoteNotification) {
    try {
      await deleteNotification(n._id);
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    } catch {}
  }

  async function handleClearAll() {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllNotifications();
            setNotifications([]);
          } catch {}
        },
      },
    ]);
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Header row */}
      <View style={[styles.headerRow, { borderBottomColor: c.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Notifications</Text>
          <View style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="notifications-outline" size={13} color={unreadCount > 0 ? c.primary : c.textSecondary} />
            {unreadCount > 0 && (
              <Text style={[styles.chipCount, { color: '#ef4444' }]}>{unreadCount}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
              <Ionicons name="checkmark-done-outline" size={18} color={c.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRefresh} style={styles.actionBtn}>
            <Ionicons name="refresh-outline" size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="notifications-off-outline" size={40} color={c.textSecondary} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {error ?? 'No notifications yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const read = isRead(item);
          return (
            <TouchableOpacity
              onPress={() => handleMarkRead(item)}
              activeOpacity={0.8}
              style={[
                styles.card,
                {
                  backgroundColor: read ? c.surface : c.primary + '12',
                  borderColor: read ? c.border : c.primary + '44',
                },
              ]}
            >
              {/* Unread dot */}
              <View style={styles.dot}>
                {!read && <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text
                    style={[
                      styles.title,
                      { color: c.text, fontWeight: read ? '500' : '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.badge, { backgroundColor: c.primary + '22', color: c.primary }]}>
                    {item.type}
                  </Text>
                </View>
                <Text style={[styles.body, { color: c.textSecondary }]}>{item.body}</Text>
                <Text style={[styles.date, { color: c.textSecondary }]}>{formatDate(item.sentAt)}</Text>
              </View>

              {/* Delete */}
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyText: { fontSize: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipCount: { fontSize: 12, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6, borderRadius: 8 },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  dot: { width: 10, marginTop: 4, alignItems: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: { fontSize: 15, flex: 1, marginRight: SPACING.sm },
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
  date: { fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 4, marginTop: 2 },
});

