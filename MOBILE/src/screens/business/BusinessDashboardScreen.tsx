import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedSurface, ThemedButton } from '../../components/Themed';
import { apiGet } from '../../config/api';
import { getStoredAccountId } from '../../config/api';

type SalesOverview = {
  today: number;
  week: number;
  month: number;
};

type DashboardData = {
  salesOverview: SalesOverview;
  topProducts?: { productId: string; name: string; units: number; revenue: number }[];
  fulfillmentRate?: number | null;
  responseRate?: number | null;
};

type ReviewAggregate = {
  rating: number | null;
  reviewsCount: number;
};

export function BusinessDashboardScreen() {
  const navigation = useNavigation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const accountId = await getStoredAccountId();
      const [dash, orders, agg] = await Promise.all([
        apiGet<DashboardData>('commerce/dashboard').catch(() => null),
        apiGet<unknown[]>('commerce/orders').catch(() => []),
        accountId
          ? apiGet<ReviewAggregate>(`commerce/reviews/aggregate?sellerId=${encodeURIComponent(accountId)}`).catch(
              () => null
            )
          : Promise.resolve(null),
      ]);
      if (dash) setDashboard(dash);
      setOrdersCount(Array.isArray(orders) ? orders.length : 0);
      if (agg) {
        setRating(agg.rating ?? null);
        setReviewsCount(agg.reviewsCount ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const sales = dashboard?.salesOverview;
  const formatMoney = (n: number) => `₹${Number(n).toLocaleString()}`;

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Business Dashboard" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !dashboard ? (
          <ThemedText secondary>Loading…</ThemedText>
        ) : (
          <>
            <ThemedText style={styles.sectionTitle}>Sales</ThemedText>
            <ThemedSurface style={styles.card}>
              <ThemedText secondary style={styles.label}>
                Today
              </ThemedText>
              <ThemedText style={styles.value}>
                {sales ? formatMoney(sales.today) : '—'}
              </ThemedText>
            </ThemedSurface>
            <ThemedSurface style={styles.card}>
              <ThemedText secondary style={styles.label}>
                Last 7 days
              </ThemedText>
              <ThemedText style={styles.value}>
                {sales ? formatMoney(sales.week) : '—'}
              </ThemedText>
            </ThemedSurface>

            <ThemedText style={styles.sectionTitle}>Orders summary</ThemedText>
            <ThemedSurface style={styles.card}>
              <ThemedText style={styles.value}>{ordersCount}</ThemedText>
              <ThemedText secondary style={styles.label}>
                Total orders
              </ThemedText>
            </ThemedSurface>

            <ThemedText style={styles.sectionTitle}>Rating & reviews</ThemedText>
            <ThemedSurface style={styles.card}>
              <ThemedText style={styles.value}>
                {rating != null ? `${rating.toFixed(1)} ★` : '—'}
              </ThemedText>
              <ThemedText secondary style={styles.label}>
                {reviewsCount} review{reviewsCount === 1 ? '' : 's'}
              </ThemedText>
            </ThemedSurface>

            {dashboard?.fulfillmentRate != null && (
              <>
                <ThemedText style={styles.sectionTitle}>Performance</ThemedText>
                <ThemedSurface style={styles.card}>
                  <ThemedText style={styles.value}>
                    {dashboard.fulfillmentRate}%
                  </ThemedText>
                  <ThemedText secondary style={styles.label}>
                    Fulfillment on time
                  </ThemedText>
                </ThemedSurface>
              </>
            )}

            <ThemedText style={styles.sectionTitle}>Quick actions</ThemedText>
            <ThemedButton
              label="Commerce"
              onPress={() => navigation.navigate('Commerce' as never)}
              variant="primary"
              style={styles.button}
            />
            <ThemedButton
              label="Orders"
              onPress={() => navigation.navigate('SellerOrders' as never)}
              variant="secondary"
              style={styles.button}
            />
            <ThemedButton
              label="Products"
              onPress={() => navigation.navigate('SellerProducts' as never)}
              variant="secondary"
              style={styles.button}
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { fontWeight: '600', fontSize: 15, marginTop: 8, marginBottom: 4 },
  card: { padding: 14, borderRadius: 12 },
  label: { fontSize: 12, marginTop: 2 },
  value: { fontSize: 18, fontWeight: '600' },
  button: { marginTop: 4 },
});
