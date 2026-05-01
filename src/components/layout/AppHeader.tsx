// ─── App Header ──────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { SPACING, APP_NAME } from '../../types/constants';
import { getUnreadCount } from '../../services/notification/notification.service';

interface Props {
  title?: string;
}

export function AppHeader({ title = APP_NAME }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: c.headerBackground, borderBottomColor: c.border }]}>
      <Text style={[styles.title, { color: c.headerText }]}>{title}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={styles.bellBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="notifications-outline" size={22} color={c.headerText} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bellBtn: {
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

