import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/theme/ThemeProvider';
import { register } from '../../services/auth/auth.service';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SPACING } from '../../types/constants';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigation.navigate('PendingApproval');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: c.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your account will need admin approval before you can log in.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: c.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: c.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={c.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: c.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={c.textSecondary}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.primary }, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Register</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: c.primary }]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: SPACING.xl },
  form: { gap: SPACING.sm },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: SPACING.sm,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: SPACING.md },
  linkText: { fontSize: 14 },
});
