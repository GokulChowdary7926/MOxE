import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader } from '../components/Themed';

export function SettingsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { accountType, setAccountType } = useAccount();

  const openBalance = () => (navigation as any).navigate('Balance');

  const rows: { label: string; sub?: string }[] = [
    { label: 'Account', sub: 'Phone, email, username, account type' },
    { label: 'Balance', sub: 'Earnings, payouts, withdraw' },
    { label: 'Privacy', sub: 'Account privacy, stories, search, activity' },
    { label: 'Safety', sub: 'Blocking, restricting, muting, SOS' },
    { label: 'Advanced', sub: 'Voice, Nearby, Promity, protection' },
    { label: 'Notifications', sub: 'Push, quiet mode' },
    { label: 'Saved', sub: 'Collections' },
    { label: 'Archive' },
    { label: 'Switch account type', sub: accountType },
  ];

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Settings" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((r, i) => (
          <TouchableOpacity
            key={r.label}
            style={[
              styles.row,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: i < rows.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            onPress={
              r.label === 'Switch account type'
                ? () => {
                    const next =
                      accountType === 'personal'
                        ? 'business'
                        : accountType === 'business'
                          ? 'creator'
                          : accountType === 'creator'
                            ? 'job'
                            : 'personal';
                    setAccountType(next);
                  }
                : r.label === 'Balance'
                  ? openBalance
                  : r.label === 'Account'
                    ? () => (navigation as any).navigate('AccountSettings')
                    : r.label === 'Privacy'
                      ? () => (navigation as any).navigate('PrivacySettings')
                      : r.label === 'Safety'
                        ? () => (navigation as any).navigate('SafetySettings')
                        : r.label === 'Advanced'
                          ? () => (navigation as any).navigate('AdvancedSettings')
                          : undefined
            }
          >
            <ThemedText style={styles.rowLabel}>{r.label}</ThemedText>
            {r.sub ? (
              <ThemedText secondary style={styles.rowSub}>
                {r.sub}
              </ThemedText>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowLabel: { fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 12 },
});
