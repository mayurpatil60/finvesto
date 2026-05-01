import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../components/theme/ThemeProvider';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SPACING } from '../../types/constants';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'PendingApproval'>;

export function PendingApprovalScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.container}>
        <Text style={[styles.icon, { color: c.primary }]}>⏳</Text>
        <Text style={[styles.title, { color: c.text }]}>Pending Approval</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          Your account has been created and is awaiting admin approval. You'll be able to log in
          once your account is approved.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: SPACING.md,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
