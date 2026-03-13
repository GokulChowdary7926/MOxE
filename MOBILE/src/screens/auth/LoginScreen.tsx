import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAccount } from '../../context/AccountContext';
import { ThemedView, ThemedText, ThemedButton, ThemedInput } from '../../components/Themed';
import { apiPost, setStoredAuth } from '../../config/api';

export function LoginScreen() {
  const { setLoggedIn } = useAccount();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !password) {
      Alert.alert('Login', 'Enter your phone, email or username and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ token: string; accountId: string }>(
        'auth/login',
        { loginId, password },
        { skipAuth: true }
      );
      await setStoredAuth(data.token, data.accountId);
      setLoggedIn(true);
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <View style={styles.center}>
        <ThemedText style={styles.logo}>MOxE</ThemedText>
        <ThemedText secondary style={styles.tagline}>
          Log in to your MOxE Basic account.
        </ThemedText>
        <ThemedInput
          placeholder="Phone, email, or username"
          style={styles.input}
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
          keyboardType="default"
        />
        <ThemedInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <ThemedButton
          label={loading ? 'Logging in…' : 'Log in'}
          onPress={handleLogin}
          style={styles.btn}
          disabled={loading}
        />
        <ThemedText secondary style={styles.footer}>
          By continuing, you agree to MOxE’s Terms and Privacy Policy.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  btn: {
    marginTop: 16,
    marginBottom: 24,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
  },
});

