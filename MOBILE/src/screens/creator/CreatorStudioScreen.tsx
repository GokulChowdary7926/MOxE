import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/Themed';
import { apiGet } from '../../config/api';

type SubscriberRow = {
  id: string;
  tier: string;
  price: number;
  status: string;
  subscriber?: { id: string; username: string | null; displayName: string | null };
};

type BonusRow = {
  id: string;
  month: string;
  targetViews: number;
  actualViews: number;
  bonusAmount: number;
  status: string;
};

export function CreatorStudioScreen() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    Promise.all([
      apiGet<{ subscribers: SubscriberRow[] }>('accounts/me/subscribers'),
      apiGet<{ bonuses: BonusRow[] }>('creator/bonuses'),
    ])
      .then(([subData, bonusData]) => {
        setSubscribers(Array.isArray(subData?.subscribers) ? subData.subscribers : []);
        setBonuses(Array.isArray(bonusData?.bonuses) ? bonusData.bonuses : []);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load earnings');
        setSubscribers([]);
        setBonuses([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const subscriptionRevenue = subscribers.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + (Number(b.bonusAmount) || 0), 0);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Creator Studio" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <ThemedText style={styles.heading}>Earnings</ThemedText>
        {loading && !refreshing && <ActivityIndicator style={styles.loader} />}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        {!loading && !error && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <ThemedText secondary style={styles.statLabel}>Subscribers</ThemedText>
                <ThemedText style={styles.statValue}>{subscribers.length}</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText secondary style={styles.statLabel}>Subscription revenue</ThemedText>
                <ThemedText style={styles.statValue}>${subscriptionRevenue.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText secondary style={styles.statLabel}>Reel bonuses</ThemedText>
                <ThemedText style={styles.statValue}>${totalBonuses.toFixed(2)}</ThemedText>
              </View>
            </View>
            {bonuses.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Reel bonuses</ThemedText>
                {bonuses.map((b) => (
                  <View key={b.id} style={styles.bonusRow}>
                    <ThemedText>{b.month}</ThemedText>
                    <ThemedText secondary>
                      {b.actualViews}/{b.targetViews} · ${Number(b.bonusAmount).toFixed(2)} · {b.status}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
            {subscribers.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                  Active subscribers ({subscribers.length})
                </ThemedText>
                {subscribers.slice(0, 10).map((s) => (
                  <View key={s.id} style={styles.subRow}>
                    <ThemedText numberOfLines={1}>
                      {s.subscriber?.displayName ?? s.subscriber?.username ?? 'Subscriber'}
                    </ThemedText>
                    <ThemedText secondary>${Number(s.price).toFixed(2)}/mo</ThemedText>
                  </View>
                ))}
                {subscribers.length > 10 && (
                  <ThemedText secondary style={styles.more}>
                    +{subscribers.length - 10} more
                  </ThemedText>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  heading: { fontWeight: '600', marginBottom: 4 },
  loader: { marginVertical: 16 },
  error: { color: '#ef4444', marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '600' },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: '500', marginBottom: 8 },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  more: { fontSize: 12, marginTop: 6, paddingHorizontal: 12 },
});
