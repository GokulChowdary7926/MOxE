import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; images?: string[] | null };
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  returnStatus?: string | null;
  refundedAt?: string | null;
  seller?: { id: string; username: string; displayName?: string | null };
  items?: OrderItem[];
  hasReview?: boolean;
};

/**
 * Buyer "My Orders" – lists orders placed by the current user (GET /commerce/orders?asBuyer=true).
 */
export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${getApiBase()}/commerce/orders?asBuyer=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load orders');
        return r.json();
      })
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <ThemedView className="min-h-screen">
      <ThemedHeader
        title="My Orders"
        left={
          <button type="button" onClick={() => navigate(-1)} className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </button>
        }
      />
      <div className="px-4 py-4 max-w-3xl mx-auto space-y-4">
        {loading && <ThemedText secondary>Loading orders…</ThemedText>}
        {error && <ThemedText className="text-moxe-danger">{error}</ThemedText>}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-8">
            <ThemedText secondary>You haven’t placed any orders yet.</ThemedText>
            <Link to="/" className="mt-3 inline-block text-moxe-primary font-medium">Browse shops</Link>
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/commerce/orders/${o.id}`}
                  className="block rounded-xl border border-moxe-border bg-moxe-surface p-3 hover:border-moxe-primary/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <ThemedText className="font-medium text-moxe-text">
                        Order {o.id.slice(0, 8)}… · @{o.seller?.username ?? 'seller'}
                      </ThemedText>
                      <ThemedText secondary className="text-xs mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                        {o.returnStatus && o.status !== 'REFUNDED' && o.returnStatus !== 'REFUNDED'
                          ? ` · Return: ${o.returnStatus}`
                          : ''}
                        {(o.status === 'REFUNDED' || o.returnStatus === 'REFUNDED') ? ' · Refunded' : ''}
                      </ThemedText>
                    </div>
                    <ThemedText className="font-semibold text-moxe-text">${Number(o.total).toFixed(2)}</ThemedText>
                  </div>
                  {o.items?.length ? (
                    <p className="text-xs text-moxe-textSecondary mt-1">
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ThemedView>
  );
}
