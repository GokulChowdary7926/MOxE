import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedSurface, ThemedButton } from '../../components/Themed';
import { apiGet, apiPatch } from '../../config/api';

type SellerOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  buyer?: {
    id: string;
    username: string | null;
    displayName: string | null;
    profilePhoto: string | null;
  } | null;
  items: {
    product: { id: string; name: string; images: string[] };
    quantity: number;
    priceAtPurchase: number;
  }[];
};

export function SellerOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<SellerOrder[] | { error: string }>('commerce/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  async function updateOrderStatus(orderId: string, status: 'SHIPPED' | 'DELIVERED') {
    setUpdatingOrderId(orderId);
    try {
      const updated = await apiPatch<SellerOrder>(`commerce/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    } catch {
      // ignore
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="Orders"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ThemedText style={styles.backText}>←</ThemedText>
          </TouchableOpacity>
        }
        right={null}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && orders.length === 0 ? (
          <ThemedText secondary>Loading orders…</ThemedText>
        ) : orders.length === 0 ? (
          <ThemedText secondary style={styles.empty}>
            No orders yet. When customers buy from your shop, they’ll appear here.
          </ThemedText>
        ) : (
          <>
            <ThemedText secondary style={styles.count}>
              {orders.length} order{orders.length === 1 ? '' : 's'}
            </ThemedText>
            {orders.map((o) => (
              <ThemedSurface key={o.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <ThemedText style={styles.orderId}>#{o.id.slice(0, 8)}</ThemedText>
                  <View style={styles.statusBadge}>
                    <ThemedText secondary style={styles.statusText}>
                      {o.status}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText secondary style={styles.date}>
                  {formatDate(o.createdAt)}
                </ThemedText>
                {o.buyer && (
                  <ThemedText secondary style={styles.buyer}>
                    Buyer: {o.buyer.displayName || o.buyer.username || 'Customer'}
                  </ThemedText>
                )}
                <ThemedText style={styles.items}>
                  {o.items
                    .map((it) => `${it.product.name} ×${it.quantity}`)
                    .slice(0, 2)
                    .join(', ')}
                  {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                </ThemedText>
                <ThemedText style={styles.total}>
                  ₹{Number(o.total ?? 0).toLocaleString()}
                </ThemedText>
                <View style={styles.actions}>
                  <ThemedButton
                    label={updatingOrderId === o.id ? '…' : 'Mark shipped'}
                    onPress={() => updateOrderStatus(o.id, 'SHIPPED')}
                    variant="secondary"
                    style={styles.actionBtn}
                    disabled={
                      updatingOrderId === o.id ||
                      o.status === 'SHIPPED' ||
                      o.status === 'DELIVERED'
                    }
                  />
                  <ThemedButton
                    label="Mark delivered"
                    onPress={() => updateOrderStatus(o.id, 'DELIVERED')}
                    variant="primary"
                    style={styles.actionBtn}
                    disabled={updatingOrderId === o.id || o.status === 'DELIVERED'}
                  />
                </View>
              </ThemedSurface>
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  backText: { fontSize: 24 },
  count: { fontSize: 13, marginBottom: 4 },
  empty: { fontSize: 14 },
  card: { padding: 14, borderRadius: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 15, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  statusText: { fontSize: 12 },
  date: { fontSize: 12, marginBottom: 2 },
  buyer: { fontSize: 12, marginBottom: 4 },
  items: { fontSize: 13, marginBottom: 2 },
  total: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { minWidth: 120 },
});
