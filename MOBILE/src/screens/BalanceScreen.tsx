import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedSurface } from '../components/Themed';

function formatMoney(value: number): string {
  return value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

/**
 * Creator/business balance — activity from API only when wallet/settlements endpoints exist.
 */
export function BalanceScreen() {
  const { theme } = useTheme();
  const { accountType } = useAccount();
  const navigation = useNavigation();

  const availableBalance = 0;
  const thisMonth = 0;
  const pending = 0;

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Balance" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedSurface style={styles.card}>
          <ThemedText secondary style={styles.cardLabel}>Available balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>{formatMoney(availableBalance)}</ThemedText>
          <ThemedButton
            label="Withdraw"
            onPress={() => (navigation as { navigate: (name: string) => void }).navigate('Withdraw')}
            style={styles.withdrawBtn}
          />
        </ThemedSurface>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { borderColor: theme.colors.border }]}>
            <ThemedText secondary style={styles.summaryLabel}>This month</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatMoney(thisMonth)}</ThemedText>
          </View>
          <View style={[styles.summaryBox, { borderColor: theme.colors.border }]}>
            <ThemedText secondary style={styles.summaryLabel}>Pending</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatMoney(pending)}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent activity</ThemedText>
          <ThemedText secondary style={styles.emptyActivity}>
            No transactions yet. Earnings and payouts will appear here when your account is set up for payouts on MOxE.
          </ThemedText>
        </View>

        {(accountType === 'creator' || accountType === 'business') && (
          <ThemedText secondary style={styles.footer}>
            {accountType === 'creator'
              ? 'Earnings from subscriptions, gifts, live badges, and bonuses.'
              : 'Earnings from sales and payouts. Settlements run weekly.'}
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 13, marginBottom: 4 },
  balanceAmount: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  withdrawBtn: { alignSelf: 'flex-start' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryBox: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyActivity: { fontSize: 14, lineHeight: 20 },
  footer: { fontSize: 12, marginTop: 8 },
});
