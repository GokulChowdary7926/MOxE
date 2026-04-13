import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';

type OrderDetail = {
  id: string;
  total: number;
  status: string;
  trackingNumber?: string | null;
  createdAt: string;
  viewerRole: 'buyer' | 'seller';
  returnStatus?: string | null;
  returnRequestedAt?: string | null;
  returnLabelUrl?: string | null;
  returnTrackingNumber?: string | null;
  returnReceivedAt?: string | null;
  refundedAt?: string | null;
  buyer?: { id?: string; username: string; displayName?: string | null };
  seller?: { id?: string; username: string; displayName?: string | null };
  items: { id: string; quantity: number; priceAtPurchase: number; product: { id: string; name: string; images?: string[] | null } }[];
};

function formatReturnStatus(returnStatus: string | null | undefined, orderStatus: string): string | null {
  if (orderStatus === 'REFUNDED' || returnStatus === 'REFUNDED') return 'Refund completed';
  if (!returnStatus) return null;
  const map: Record<string, string> = {
    PENDING: 'Return requested — waiting for seller',
    APPROVED: 'Return approved — use the label to ship back',
    SHIPPED: 'Return shipped — seller tracking inbound package',
    RECEIVED: 'Return received — refund pending',
    REFUNDED: 'Refund completed',
  };
  return map[returnStatus] ?? returnStatus;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { canCommerce } = useAccountCapabilities();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState('');
  const [returnTracking, setReturnTracking] = useState('');

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const res = await fetch(`${getApiBase()}/commerce/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || 'Order not found');
    }
    const data = (await res.json()) as OrderDetail;
    setOrder(data);
    setLabelUrl(typeof data.returnLabelUrl === 'string' ? data.returnLabelUrl : '');
    setReturnTracking(typeof data.returnTrackingNumber === 'string' ? data.returnTrackingNumber : '');
  }, [orderId, navigate]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadOrder()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadOrder]);

  const runAction = async (path: string, init: RequestInit) => {
    const token = getToken();
    if (!token || !orderId) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`${getApiBase()}/commerce/orders/${orderId}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || res.statusText || 'Request failed');
      }
      const data = body as OrderDetail & { viewerRole?: OrderDetail['viewerRole'] };
      setOrder((prev) => ({
        ...data,
        viewerRole: data.viewerRole ?? prev?.viewerRole ?? 'buyer',
      }));
      if (typeof data.returnLabelUrl === 'string') setLabelUrl(data.returnLabelUrl);
      if (typeof data.returnTrackingNumber === 'string') setReturnTracking(data.returnTrackingNumber);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading || !order) {
    return (
      <ThemedView className="min-h-screen">
        <ThemedHeader title="Order" left={<button type="button" onClick={() => navigate(-1)} className="text-moxe-text">←</button>} />
        <div className="p-4">{error ? <ThemedText className="text-moxe-danger">{error}</ThemedText> : <ThemedText secondary>Loading…</ThemedText>}</div>
      </ThemedView>
    );
  }

  const returnLine = formatReturnStatus(order.returnStatus, order.status);
  const canRequestReturn = order.viewerRole === 'buyer' && order.status === 'DELIVERED' && !order.returnStatus;
  const showSellerReturn =
    order.viewerRole === 'seller' && canCommerce && order.returnStatus && order.returnStatus !== 'REFUNDED' && order.status !== 'REFUNDED';

  return (
    <ThemedView className="min-h-screen">
      <ThemedHeader title={`Order ${order.id.slice(0, 8)}`} left={<button type="button" onClick={() => navigate(-1)} className="text-moxe-text">←</button>} />
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <ThemedText className="font-medium text-moxe-text">Status: {order.status}</ThemedText>
          <ThemedText className="font-semibold text-moxe-text">${order.total.toFixed(2)}</ThemedText>
        </div>
        {returnLine && (
          <div className="rounded-lg border border-moxe-border bg-moxe-surface/80 px-3 py-2">
            <ThemedText className="text-sm text-moxe-text">{returnLine}</ThemedText>
            {order.refundedAt && (
              <ThemedText secondary className="text-xs mt-1">{new Date(order.refundedAt).toLocaleString()}</ThemedText>
            )}
          </div>
        )}
        {order.trackingNumber && <ThemedText secondary className="text-sm">Tracking: {order.trackingNumber}</ThemedText>}
        {order.returnLabelUrl && (
          <a href={order.returnLabelUrl} target="_blank" rel="noreferrer" className="text-moxe-primary text-sm font-medium inline-block">
            Open return label
          </a>
        )}
        {order.returnTrackingNumber && order.viewerRole === 'buyer' && (
          <ThemedText secondary className="text-sm">Your return tracking: {order.returnTrackingNumber}</ThemedText>
        )}
        <ThemedText secondary className="text-xs">{new Date(order.createdAt).toLocaleString()}</ThemedText>
        {(order.seller || order.buyer) && (
          <ThemedText secondary className="text-sm">
            {order.seller ? `Seller: @${order.seller.username}` : null}
            {order.buyer ? `Buyer: @${order.buyer.username}` : null}
          </ThemedText>
        )}

        {actionError && <ThemedText className="text-moxe-danger text-sm">{actionError}</ThemedText>}

        {canRequestReturn && (
          <div className="pt-2">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => runAction('/return', { method: 'POST' })}
              className="rounded-lg bg-moxe-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Request return
            </button>
          </div>
        )}

        {showSellerReturn && order.returnStatus === 'PENDING' && (
          <div className="space-y-2 rounded-xl border border-moxe-border p-3">
            <ThemedText className="font-medium text-moxe-text text-sm">Approve return</ThemedText>
            <ThemedText secondary className="text-xs">Optional prepaid label URL (buyer will see a link).</ThemedText>
            <input
              className="w-full rounded border border-moxe-border bg-moxe-bg px-2 py-1.5 text-sm text-moxe-text"
              placeholder="https://…"
              value={labelUrl}
              onChange={(e) => setLabelUrl(e.target.value)}
            />
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => runAction('/return/approve', { method: 'POST', body: JSON.stringify({ returnLabelUrl: labelUrl.trim() || undefined }) })}
              className="rounded-lg bg-moxe-primary text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Approve return
            </button>
          </div>
        )}

        {showSellerReturn && (order.returnStatus === 'APPROVED' || order.returnStatus === 'SHIPPED') && (
          <div className="space-y-2 rounded-xl border border-moxe-border p-3">
            {order.returnStatus === 'APPROVED' && (
              <>
                <ThemedText className="font-medium text-moxe-text text-sm">Return tracking (inbound)</ThemedText>
                <input
                  className="w-full rounded border border-moxe-border bg-moxe-bg px-2 py-1.5 text-sm text-moxe-text"
                  placeholder="Carrier tracking number"
                  value={returnTracking}
                  onChange={(e) => setReturnTracking(e.target.value)}
                />
                <button
                  type="button"
                  disabled={actionBusy || !returnTracking.trim()}
                  onClick={() =>
                    runAction('/return/tracking', {
                      method: 'PATCH',
                      body: JSON.stringify({ returnTrackingNumber: returnTracking.trim() }),
                    })
                  }
                  className="rounded-lg border border-moxe-border px-3 py-1.5 text-sm font-medium text-moxe-text disabled:opacity-50"
                >
                  Save tracking
                </button>
              </>
            )}
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => runAction('/return/received', { method: 'POST' })}
              className="block rounded-lg border border-moxe-border px-3 py-1.5 text-sm font-medium text-moxe-text disabled:opacity-50"
            >
              Mark return received
            </button>
          </div>
        )}

        {showSellerReturn && order.returnStatus === 'RECEIVED' && (
          <div className="rounded-xl border border-moxe-border p-3">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => runAction('/return/refund', { method: 'POST' })}
              className="rounded-lg bg-moxe-primary text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Process refund
            </button>
            <ThemedText secondary className="text-xs mt-2 block">
              Stripe orders use your configured PaymentIntent refund; other payments are marked refunded in-app only.
            </ThemedText>
          </div>
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
