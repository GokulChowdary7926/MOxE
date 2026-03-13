import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../../components/Themed';
import { apiGet } from '../../config/api';

export function CommerceScreen() {
  const navigation = useNavigation();
  const [productCount, setProductCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [products, orders] = await Promise.all([
        apiGet<unknown[] | { error?: string }>('commerce/products').catch(() => []),
        apiGet<unknown[] | { error?: string }>('commerce/orders').catch(() => []),
      ]);
      setProductCount(Array.isArray(products) ? products.length : 0);
      setOrderCount(Array.isArray(orders) ? orders.length : 0);
    } catch {
      setProductCount(0);
      setOrderCount(0);
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

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="Commerce"
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
        <ThemedText style={styles.heading}>MOxE Commerce</ThemedText>
        <ThemedText secondary style={styles.body}>
          Manage your shop, products, and orders.
        </ThemedText>
        {!loading && (
          <ThemedText secondary style={styles.summary}>
            {productCount} product{productCount === 1 ? '' : 's'} · {orderCount} order{orderCount === 1 ? '' : 's'}
          </ThemedText>
        )}
        <ThemedButton
          label="View Orders"
          onPress={() => navigation.navigate('SellerOrders' as never)}
          variant="primary"
          style={styles.button}
        />
        <ThemedButton
          label="View Products"
          onPress={() => navigation.navigate('SellerProducts' as never)}
          variant="secondary"
          style={styles.button}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  backText: { fontSize: 24 },
  heading: { fontWeight: '600', fontSize: 18 },
  body: { fontSize: 14 },
  summary: { fontSize: 13 },
  button: { marginTop: 8 },
});
