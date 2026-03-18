import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

type OrderDetail = {
  id: string;
  total: number;
  status: string;
  trackingNumber?: string | null;
  createdAt: string;
  buyer?: { username: string; displayName?: string | null };
  seller?: { username: string; displayName?: string | null };
  items: { id: string; quantity: number; priceAtPurchase: number; product: { id: string; name: string; images?: string[] | null } }[];
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    fetch(`${getApiBase()}/commerce/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error('Order not found');
        return r.json();
      })
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  if (loading || !order) {
    return (
      <ThemedView className="min-h-screen">
        <ThemedHeader title="Order" left={<button type="button" onClick={() => navigate(-1)} className="text-moxe-text">←</button>} />
        <div className="p-4">{error ? <ThemedText className="text-moxe-danger">{error}</ThemedText> : <ThemedText secondary>Loading…</ThemedText>}</div>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="min-h-screen">
      <ThemedHeader title={`Order ${order.id.slice(0, 8)}`} left={<button type="button" onClick={() => navigate(-1)} className="text-moxe-text">←</button>} />
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <ThemedText className="font-medium text-moxe-text">Status: {order.status}</ThemedText>
          <ThemedText className="font-semibold text-moxe-text">${order.total.toFixed(2)}</ThemedText>
        </div>
        {order.trackingNumber && <ThemedText secondary className="text-sm">Tracking: {order.trackingNumber}</ThemedText>}
        <ThemedText secondary className="text-xs">{new Date(order.createdAt).toLocaleString()}</ThemedText>
        {(order.seller || order.buyer) && (
          <ThemedText secondary className="text-sm">
            {order.seller ? `Seller: @${order.seller.username}` : null}
            {order.buyer ? `Buyer: @${order.buyer.username}` : null}
          </ThemedText>
        )}
        <div>
          <ThemedText className="font-medium text-moxe-text mb-2">Items</ThemedText>
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between text-sm">
                <span className="text-moxe-text">{it.product.name} × {it.quantity}</span>
                <span className="text-moxe-textSecondary">${(it.quantity * it.priceAtPurchase).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/commerce/orders" className="inline-block text-moxe-primary font-medium text-sm">← My Orders</Link>
      </div>
    </ThemedView>
  );
}
