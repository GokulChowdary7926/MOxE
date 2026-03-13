import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedSurface } from '../../components/Themed';
import { apiGet } from '../../config/api';

type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  images?: string[];
  inventory?: number | null;
  isActive?: boolean;
  createdAt?: string;
};

export function SellerProductsScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Product[] | { error: string }>('commerce/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
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
        title="Products"
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
        {loading && products.length === 0 ? (
          <ThemedText secondary>Loading products…</ThemedText>
        ) : products.length === 0 ? (
          <ThemedText secondary style={styles.empty}>
            No products yet. Add products from the web Commerce page to start selling.
          </ThemedText>
        ) : (
          <>
            <ThemedText secondary style={styles.count}>
              {products.length} product{products.length === 1 ? '' : 's'}
            </ThemedText>
            {products.map((p) => (
              <ThemedSurface key={p.id} style={styles.card}>
                <View style={styles.cardRow}>
                  {p.images && p.images.length > 0 ? (
                    <Image
                      source={{ uri: p.images[0] }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={styles.cardBody}>
                    <ThemedText style={styles.productName} numberOfLines={2}>
                      {p.name}
                    </ThemedText>
                    <ThemedText style={styles.price}>
                      ₹{Number(p.price ?? 0).toLocaleString()}
                      {p.compareAtPrice != null && p.compareAtPrice > 0 && (
                        <ThemedText secondary style={styles.compareAt}>
                          {' '}
                          ₹{Number(p.compareAtPrice).toLocaleString()}
                        </ThemedText>
                      )}
                    </ThemedText>
                    <ThemedText secondary style={styles.meta}>
                      Stock: {p.inventory != null ? p.inventory : '—'} · {(p.isActive ?? true) ? 'Active' : 'Hidden'}
                    </ThemedText>
                  </View>
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
  card: { padding: 12, borderRadius: 12 },
  cardRow: { flexDirection: 'row', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: 'rgba(128,128,128,0.2)' },
  cardBody: { flex: 1, minWidth: 0 },
  productName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  price: { fontSize: 14, marginBottom: 2 },
  compareAt: { fontSize: 12, textDecorationLine: 'line-through' },
  meta: { fontSize: 12 },
});
