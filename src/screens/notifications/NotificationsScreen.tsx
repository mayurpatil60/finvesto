// ─── Notifications Screen ─────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../components/theme/ThemeProvider";
import {
  NotificationLog,
  notificationLogService,
} from "../../services/NotificationLogService";

const STATUS_COLORS: Record<NotificationLog["status"], string> = {
  sent: "#34A853",
  failed: "#FF5252",
  no_tokens: "#FFA000",
  no_buys: "#A0A0A0",
};

const STATUS_LABELS: Record<NotificationLog["status"], string> = {
  sent: "Sent",
  failed: "Failed",
  no_tokens: "No Devices",
  no_buys: "No Buys",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function NotificationsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await notificationLogService.getLogs(100);
      setLogs(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      backgroundColor: c.surface,
      borderBottomColor: c.border,
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 52,
      paddingBottom: 14,
    },
    headerTitle: {
      color: c.text,
      fontSize: 20,
      fontWeight: "700",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
    },
    errorText: {
      color: c.error,
      fontSize: 14,
      textAlign: "center",
      marginHorizontal: 24,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
    },
    listContent: {
      padding: 12,
      gap: 10,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 14,
      borderColor: c.border,
      borderWidth: 1,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    title: {
      color: c.text,
      fontSize: 15,
      fontWeight: "600",
      flex: 1,
    },
    badge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
    },
    body: {
      color: c.text,
      fontSize: 14,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: "row",
      gap: 12,
    },
    metaText: {
      color: c.textSecondary,
      fontSize: 12,
    },
    dateText: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 6,
    },
    errorCard: {
      marginTop: 4,
      backgroundColor: "#2a1a1a",
      borderRadius: 6,
      padding: 8,
    },
    errorCardText: {
      color: c.error,
      fontSize: 11,
    },
  });

  const renderItem = ({ item }: { item: NotificationLog }) => {
    const statusColor = STATUS_COLORS[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Buy: {item.buyCount}</Text>
          <Text style={styles.metaText}>Devices: {item.recipientCount}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
        {item.error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{item.error}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          logs.length === 0 && styles.center,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLogs(true)}
            tintColor={c.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notifications yet</Text>
        }
      />
    </View>
  );
}
