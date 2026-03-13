import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedSurface } from '../../components/Themed';

const MOCK_AVAILABLE = 1247.5;
const MOCK_BANK = 'Chase •••• 4521';

export function WithdrawScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= MOCK_AVAILABLE;
  const fee = 0;
  const receive = numAmount - fee;

  const handleWithdraw = () => {
    if (!isValid) {
      setError(numAmount <= 0 ? 'Enter an amount' : 'Amount exceeds balance');
      return;
    }
    setError('');
    // In a real app: submit then go back
    (navigation as any).goBack();
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="Withdraw"
        left={
          <TouchableOpacity onPress={() => (navigation as any).goBack()}>
            <Text style={{ fontSize: 24, color: theme.colors.text }}>←</Text>
          </TouchableOpacity>
        }
        right={null}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText secondary style={styles.hint}>
            Available: ${MOCK_AVAILABLE.toFixed(2)}
          </ThemedText>
          <ThemedSurface style={styles.card}>
            <ThemedText secondary style={styles.label}>Amount</ThemedText>
            <View style={[styles.inputRow, { borderColor: theme.colors.border }]}>
              <ThemedText style={styles.currency}>$</ThemedText>
              <TextInput
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(''); }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.colors.text }]}
              />
            </View>
            {error ? <ThemedText style={[styles.error, { color: theme.colors.danger }]}>{error}</ThemedText> : null}
          </ThemedSurface>

          <ThemedSurface style={styles.card}>
            <ThemedText secondary style={styles.label}>To</ThemedText>
            <View style={[styles.bankRow, { borderColor: theme.colors.border }]}>
              <ThemedText style={styles.bankName}>{MOCK_BANK}</ThemedText>
              <ThemedText secondary style={styles.change}>Change</ThemedText>
            </View>
          </ThemedSurface>

          {numAmount > 0 && (
            <ThemedSurface style={styles.card}>
              <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
                <ThemedText secondary>Amount</ThemedText>
                <ThemedText>${numAmount.toFixed(2)}</ThemedText>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
                <ThemedText secondary>Fee</ThemedText>
                <ThemedText>${fee.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.receiveLabel}>You'll receive</ThemedText>
                <ThemedText style={[styles.receiveValue, { color: theme.colors.success }]}>
                  ${receive.toFixed(2)}
                </ThemedText>
              </View>
            </ThemedSurface>
          )}

          <ThemedButton
            label="Withdraw"
            onPress={handleWithdraw}
            style={styles.submit}
            disabled={!isValid}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, marginBottom: 12 },
  card: { padding: 16, marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  currency: { fontSize: 20, fontWeight: '600', marginRight: 4 },
  input: { flex: 1, fontSize: 20, paddingVertical: 14 },
  error: { fontSize: 12, marginTop: 8 },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  bankName: { fontWeight: '500' },
  change: { fontSize: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  receiveLabel: { fontWeight: '600' },
  receiveValue: { fontSize: 18, fontWeight: '700' },
  submit: { marginTop: 8 },
});
