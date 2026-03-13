import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedSurface } from '../../components/Themed';
import type { TransactionDetailParams } from '../../navigation/types';

function formatMoney(value: number): string {
  return value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

export function TransactionDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ TransactionDetail: TransactionDetailParams }, 'TransactionDetail'>>();
  const params = route.params;

  if (!params) return null;

  const { label, amount, date, isCredit, type } = params;

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="Transaction"
        left={
          <TouchableOpacity onPress={() => (navigation as any).goBack()}>
            <Text style={{ fontSize: 24, color: theme.colors.text }}>←</Text>
          </TouchableOpacity>
        }
        right={null}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedSurface style={styles.card}>
          <ThemedText
            style={[
              styles.amount,
              { color: isCredit ? theme.colors.success : theme.colors.text },
            ]}
          >
            {isCredit ? '+' : '-'}{formatMoney(amount)}
          </ThemedText>
          <ThemedText secondary style={styles.type}>{type}</ThemedText>
        </ThemedSurface>

        <ThemedSurface style={styles.card}>
          <Row label="Description" value={label} theme={theme} first />
          <Row label="Date" value={date} theme={theme} />
          <Row label="Type" value={type} theme={theme} />
          <Row label="Amount" value={`${isCredit ? '+' : '-'}${formatMoney(amount)}`} theme={theme} />
        </ThemedSurface>
      </ScrollView>
    </ThemedView>
  );
}

function Row({
  label,
  value,
  theme,
  first,
}: {
  label: string;
  value: string;
  theme: { colors: { border: string } };
  first?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
      ]}
    >
      <ThemedText secondary style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 20, marginBottom: 16 },
  amount: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  type: { fontSize: 14, textTransform: 'capitalize' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontWeight: '500' },
});
