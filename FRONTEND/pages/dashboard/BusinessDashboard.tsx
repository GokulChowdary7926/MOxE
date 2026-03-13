import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { ACCENT } from '../../constants/designSystem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type SalesOverview = {
  today: number;
  week: number;
  month: number;
};

type SellerDashboard = {
  salesOverview: SalesOverview;
  orderStats: {
    totalOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  rating: number | null;
  reviewsCount: number;
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  fulfillmentRate: number | null;
  responseRateMinutes: number | null;
};

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

type SellerReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: {
    id: string;
    username: string | null;
    displayName: string | null;
  } | null;
};

export default function BusinessDashboard() {
  const cap = useAccountCapabilities();
  const currentAccount = useCurrentAccount() as any;
  const accountId = currentAccount?.id as string | undefined;
  const accountType = (currentAccount?.accountType as string | undefined) ?? 'PERSONAL';

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);

  const sellerIdForReviews = useMemo(() => accountId, [accountId]);

  useEffect(() => {
    if (!cap.canCommerce || accountType !== 'BUSINESS' || !accountId) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashRes, ordersRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE}/commerce/dashboard`, { headers }),
          fetch(`${API_BASE}/commerce/orders`, { headers }),
          sellerIdForReviews
            ? fetch(`${API_BASE}/commerce/reviews?sellerId=${encodeURIComponent(sellerIdForReviews)}`)
            : Promise.resolve(null as any),
        ]);
        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboard(data as SellerDashboard);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data) ? (data as SellerOrder[]) : []);
        }
        if (reviewsRes && reviewsRes.ok) {
          const data = await reviewsRes.json();
          const list = (data?.items ?? data ?? []) as SellerReview[];
          setReviews(list);
        }
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cap.canCommerce, accountType, accountId, sellerIdForReviews]);

  if (!cap.canCommerce || accountType !== 'BUSINESS') {
    return (
      <ThemedView className="min-h-screen flex items-center justify-center pb-20 px-moxe-md">
        <ThemedText secondary className="text-center">
          Business Dashboard is available for MOxE Business accounts with Commerce enabled.
        </ThemedText>
      </ThemedView>
    );
  }

  const businessAccent = ACCENT.business; // #00A86B

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Business Dashboard"
        className="border-b border-[#262626]"
        left={
          <Link to="/profile" className="text-white text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
        right={
          <Link
            to="/commerce"
            className="text-[13px] font-medium px-3 py-1.5 rounded-moxe-md border"
            style={{ color: businessAccent, borderColor: `${businessAccent}80` }}
          >
            Commerce
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* Account-specific: Shop + Insights quick access */}
        <section className="rounded-xl border border-[#363636] p-4 bg-[#262626]" style={{ borderLeftColor: businessAccent, borderLeftWidth: 4 }}>
          <ThemedText className="font-semibold text-white mb-2" style={{ color: businessAccent }}>Business</ThemedText>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/commerce"
              className="px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: businessAccent }}
            >
              Shop
            </Link>
            <Link
              to="/analytics"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[#363636] border border-[#363636] text-white"
            >
              Insights
            </Link>
          </div>
        </section>

        {loading && !dashboard ? (
          <ThemedText secondary>Loading business insights…</ThemedText>
        ) : (
          <>
            <section>
              <ThemedText className="font-semibold text-moxe-body mb-2">Sales overview</ThemedText>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-moxe-md bg-[#262626] border border-[#363636] px-3 py-2" style={{ borderTopColor: businessAccent, borderTopWidth: 2 }}>
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Today
                  </ThemedText>
                  <ThemedText className="text-white font-semibold text-[15px]">
                    ₹{(dashboard?.salesOverview.today ?? 0).toLocaleString()}
                  </ThemedText>
                </div>
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Last 7 days
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    ₹{(dashboard?.salesOverview.week ?? 0).toLocaleString()}
                  </ThemedText>
                </div>
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    This month
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    ₹{(dashboard?.salesOverview.month ?? 0).toLocaleString()}
                  </ThemedText>
                </div>
              </div>
            </section>

            <section>
              <ThemedText className="font-semibold text-moxe-body mb-2">Orders & performance</ThemedText>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Total orders
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    {dashboard?.orderStats.totalOrders ?? 0}
                  </ThemedText>
                </div>
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Pending
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    {dashboard?.orderStats.pendingOrders ?? 0}
                  </ThemedText>
                </div>
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Delivered
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    {dashboard?.orderStats.deliveredOrders ?? 0}
                  </ThemedText>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Rating
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    {dashboard?.rating != null ? `${dashboard.rating.toFixed(1)} ★ (${dashboard.reviewsCount})` : '—'}
                  </ThemedText>
                </div>
                <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2">
                  <ThemedText secondary className="text-[11px] mb-0.5">
                    Fulfillment on time
                  </ThemedText>
                  <ThemedText className="text-moxe-body font-semibold text-[15px]">
                    {dashboard?.fulfillmentRate != null ? `${dashboard.fulfillmentRate}%` : '—'}
                  </ThemedText>
                </div>
              </div>
              <ThemedText secondary className="text-[11px] mt-1 block">
                Avg first response time in DMs:{' '}
                {dashboard?.responseRateMinutes != null ? `${dashboard.responseRateMinutes} min` : '—'}
              </ThemedText>
            </section>

            <section>
              <div className="flex items-center justify-between mb-1.5">
                <ThemedText className="font-semibold text-moxe-body">Recent orders</ThemedText>
                <Link to="/commerce" className="text-[11px] text-moxe-primary">
                  View all
                </Link>
              </div>
              {orders.length === 0 ? (
                <ThemedText secondary className="text-moxe-caption">
                  No orders yet. Once customers start buying, you&apos;ll see them here.
                </ThemedText>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <ThemedText className="text-moxe-body text-[13px] font-medium">
                          #{order.id.slice(0, 8)} • ₹{Number(order.total ?? 0).toLocaleString()}
                        </ThemedText>
                        <ThemedText secondary className="text-[11px] block mt-0.5">
                          {order.items[0]?.product?.name ?? 'Order'} ·{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </ThemedText>
                        {order.buyer && (
                          <ThemedText secondary className="text-[11px] mt-0.5 block">
                            Buyer: {order.buyer.displayName || order.buyer.username || 'Customer'}
                          </ThemedText>
                        )}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-moxe-border text-moxe-caption">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-1.5">
                <ThemedText className="font-semibold text-moxe-body">Recent reviews</ThemedText>
                {sellerIdForReviews && (
                  <a
                    href={`${API_BASE.replace('/api', '')}/shop/${encodeURIComponent(
                      currentAccount?.username || '',
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-moxe-primary"
                  >
                    View shop
                  </a>
                )}
              </div>
              {reviews.length === 0 ? (
                <ThemedText secondary className="text-moxe-caption">
                  No reviews yet. As customers review their orders, you&apos;ll see them here.
                </ThemedText>
              ) : (
                <div className="space-y-2">
                  {reviews.slice(0, 5).map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2"
                    >
                      <ThemedText className="text-[13px] text-moxe-body font-medium">
                        {rev.rating.toFixed(1)} ★
                      </ThemedText>
                      {rev.comment && (
                        <ThemedText secondary className="text-[11px] mt-0.5 block">
                          {rev.comment}
                        </ThemedText>
                      )}
                      <ThemedText secondary className="text-[11px] mt-0.5 block">
                        {rev.reviewer?.displayName || rev.reviewer?.username || 'Customer'} •{' '}
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <ThemedText className="font-semibold text-moxe-body mb-1.5">Top products</ThemedText>
              {dashboard?.topProducts?.length ? (
                <div className="space-y-1">
                  {dashboard.topProducts.slice(0, 5).map((p) => (
                    <div
                      key={p.productId}
                      className="flex items-center justify-between rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-1.5"
                    >
                      <ThemedText className="text-[13px] text-moxe-body flex-1 truncate mr-2">
                        {p.name}
                      </ThemedText>
                      <ThemedText secondary className="text-[11px] mr-2">
                        {p.units} sold
                      </ThemedText>
                      <ThemedText className="text-[11px] text-moxe-body font-medium">
                        ₹{p.revenue.toLocaleString()}
                      </ThemedText>
                    </div>
                  ))}
                </div>
              ) : (
                <ThemedText secondary className="text-moxe-caption">
                  Once you start selling, your best‑performing products will show up here.
                </ThemedText>
              )}
            </section>
          </>
        )}
      </div>
    </ThemedView>
  );
}


