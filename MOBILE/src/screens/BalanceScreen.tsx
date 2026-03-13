import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedSurface } from '../components/Themed';

type TransactionType = 'subscription' | 'gift' | 'badge' | 'sale' | 'payout' | 'bonus' | 'refund';

interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  amount: number;
  date: string;
  isCredit: boolean;
}

const MOCK_BALANCE = 1247.5;
const MOCK_PENDING = 382.0;
const MOCK_THIS_MONTH = 890.25;

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'subscription', label: 'Subscriber · @sarah_k', amount: 4.99, date: 'Today, 2:30 PM', isCredit: true },
  { id: '2', type: 'gift', label: 'Gift (Hearts) from @mike_nyc', amount: 2.50, date: 'Today, 11:00 AM', isCredit: true },
  { id: '3', type: 'payout', label: 'Payout to bank', amount: 500.0, date: 'Yesterday', isCredit: false },
  { id: '4', type: 'badge', label: 'Live badge · Gold from @alex_m', amount: 4.99, date: 'Mar 2', isCredit: true },
  { id: '5', type: 'sale', label: 'Order #RC-2847', amount: 45.0, date: 'Mar 1', isCredit: true },
  { id: '6', type: 'bonus', label: 'Reels bonus (Mar)', amount: 125.0, date: 'Mar 1', isCredit: true },
];

function formatMoney(value: number): string {
  return value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  subscription: 'Subscription',
  gift: 'Gift',
  badge: 'Live badge',
  sale: 'Sale',
  payout: 'Payout',
  bonus: 'Bonus',
  refund: 'Refund',
};

export function BalanceScreen() {
  const { theme } = useTheme();
  const { accountType } = useAccount();
  const navigation = useNavigation();

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
          <ThemedText style={styles.balanceAmount}>{formatMoney(MOCK_BALANCE)}</ThemedText>
          <ThemedButton
            label="Withdraw"
            onPress={() => (navigation as any).navigate('Withdraw')}
            style={styles.withdrawBtn}
          />
        </ThemedSurface>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { borderColor: theme.colors.border }]}>
            <ThemedText secondary style={styles.summaryLabel}>This month</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatMoney(MOCK_THIS_MONTH)}</ThemedText>
          </View>
          <View style={[styles.summaryBox, { borderColor: theme.colors.border }]}>
            <ThemedText secondary style={styles.summaryLabel}>Pending</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatMoney(MOCK_PENDING)}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent activity</ThemedText>
          {MOCK_TRANSACTIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.txRow, { borderBottomColor: theme.colors.border }]}
              activeOpacity={0.7}
              onPress={() =>
                (navigation as any).navigate('TransactionDetail', {
                  transactionId: t.id,
                  label: t.label,
                  amount: t.amount,
                  date: t.date,
                  isCredit: t.isCredit,
                  type: TYPE_LABELS[t.type] ?? t.type,
                })
              }
            >
              <View style={styles.txLeft}>
                <ThemedText style={styles.txLabel}>{t.label}</ThemedText>
                <ThemedText secondary style={styles.txDate}>{t.date}</ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.txAmount,
                  { color: t.isCredit ? theme.colors.success : theme.colors.text },
                ]}
              >
                {t.isCredit ? '+' : '-'}{formatMoney(t.amount)}
              </ThemedText>
            </TouchableOpacity>
          ))}
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
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txLeft: {},
  txLabel: { fontWeight: '500', marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  footer: { fontSize: 12, marginTop: 8 },
});
