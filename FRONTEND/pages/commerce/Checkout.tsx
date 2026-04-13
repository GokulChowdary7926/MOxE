import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type CartProduct = {
  id: string;
  name: string;
  price: number;
  images?: string[] | null;
  account?: { id: string; username: string; displayName?: string | null } | null;
};

type CartItem = {
  id: string;
  quantity: number;
  priceAtAdd: number;
  product: CartProduct;
};

type Cart = {
  id: string;
  items: CartItem[];
};

type Order = {
  id: string;
  sellerId: string;
  total: number;
  couponCode?: string | null;
  discountAmount?: number | null;
};

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerCoupons, setSellerCoupons] = useState<Record<string, string>>({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);

  const subtotal = cart
    ? cart.items.reduce((sum, it) => sum + it.quantity * it.priceAtAdd, 0)
    : 0;

  const ordersTotal = orders
    ? orders.reduce((sum, o) => sum + (o.total || 0), 0)
    : null;

  const discountApplied =
    ordersTotal != null ? Math.max(0, subtotal - ordersTotal) : null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view your cart.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/commerce/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Failed to load cart.');
        return data as Cart;
      })
      .then((data) => {
        setCart(data);
      })
      .catch((e: any) => setError(e.message || 'Failed to load cart.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setCheckingOut(true);
    setError(null);
    setOrders(null);
    try {
      const res = await fetch(`${API_BASE}/commerce/cart/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerCoupons,
          paymentMethod: 'COD',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed.');
      }
      const ords: Order[] = Array.isArray(data.orders) ? data.orders : [];
      setOrders(ords);
      setCart({ ...cart, items: [] });
    } catch (e: any) {
      setError(e.message || 'Checkout failed.');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Checkout"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-moxe-text text-2xl leading-none"
            aria-label="Back"
          >
            ←
          </button>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md max-w-3xl mx-auto space-y-4">
        {loading && <ThemedText secondary>Loading cart…</ThemedText>}
        {error && !loading && <ThemedText className="text-moxe-danger">{error}</ThemedText>}

        {!loading && cart && cart.items.length === 0 && !orders && (
          <ThemedText secondary>Your cart is empty.</ThemedText>
        )}

        {!loading && cart && cart.items.length > 0 && (
          <div className="space-y-4">
            <ThemedText className="font-semibold text-moxe-body">
              Cart by seller
            </ThemedText>
            {Object.entries(
              cart.items.reduce<Record<string, CartItem[]>>((acc, it) => {
                const sellerId = it.product.account?.id || 'account';
                (acc[sellerId] = acc[sellerId] || []).push(it);
                return acc;
              }, {}),
            ).map(([sellerId, items]) => {
              const sellerName = items[0]?.product.account?.username || 'seller';
              const sellerSubtotal = items.reduce(
                (sum, it) => sum + it.quantity * it.priceAtAdd,
                0,
              );
              return (
                <div
                  key={sellerId}
                  className="rounded-moxe-md border border-moxe-border bg-moxe-surface/60 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <ThemedText className="text-sm font-semibold">
                      @{sellerName}
                    </ThemedText>
                    <ThemedText secondary className="text-xs">
                      Subtotal: ${sellerSubtotal.toFixed(2)}
                    </ThemedText>
                  </div>
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center gap-3 p-2 rounded-moxe-md border border-moxe-border/60 bg-moxe-surface"
                      >
                        <div className="w-10 h-10 rounded-moxe-md bg-moxe-background overflow-hidden flex-shrink-0">
                          {Array.isArray(it.product.images) &&
                          it.product.images.length > 0 ? (
                            <img
                              src={it.product.images[0]}
                              alt={it.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-moxe-textSecondary">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ThemedText className="text-xs font-medium truncate">
                            {it.product.name}
                          </ThemedText>
                          <ThemedText secondary className="text-[11px] mt-0.5">
                            {it.quantity} × ${it.priceAtAdd.toFixed(2)}
                          </ThemedText>
                        </div>
                        <ThemedText className="text-xs font-semibold">
                          ${(it.quantity * it.priceAtAdd).toFixed(2)}
                        </ThemedText>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-moxe-border mt-1 space-y-1 text-xs">
                    <label className="block text-moxe-caption">
                      Coupon for @{sellerName}
                    </label>
                    <input
                      type="text"
                      value={sellerCoupons[sellerId] || ''}
                      onChange={(e) =>
                        setSellerCoupons((prev) => ({
                          ...prev,
                          [sellerId]: e.target.value,
                        }))
                      }
                      placeholder="Enter coupon code for this seller (optional)"
                      className="w-full px-3 py-1.5 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs text-moxe-body"
                    />
                  </div>
                </div>
              );
            })}

            <div className="border-t border-moxe-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-moxe-caption">Cart subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountApplied != null && (
                <>
                  <div className="flex justify-between text-moxe-success">
                    <span>Discount</span>
                    <span>- ${discountApplied.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(subtotal - discountApplied).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-3">
          <ThemedButton
            label={checkingOut ? 'Checking out…' : 'Checkout'}
            type="submit"
            disabled={checkingOut || loading || !cart || cart.items.length === 0}
            className="w-full"
          />
        </form>

        {orders && (
          <div className="mt-4 border-t border-moxe-border pt-3 space-y-2 text-sm">
            <ThemedText className="font-semibold text-moxe-body">
              Orders created ({orders.length})
            </ThemedText>
            {orders.map((o) => (
              <div key={o.id} className="flex justify-between text-xs">
                <span>Order {o.id.slice(0, 8)}…</span>
                <span>${o.total.toFixed(2)}</span>
              </div>
            ))}
            {ordersTotal != null && (
              <ThemedText secondary className="text-xs">
                Charged total: ${ordersTotal.toFixed(2)}{' '}
                {discountApplied != null && discountApplied > 0
                  ? `(saved $${discountApplied.toFixed(2)})`
                  : ''}
              </ThemedText>
            )}
            <Link to="/commerce/orders" className="mt-2 inline-block text-moxe-primary text-sm font-medium">View my orders →</Link>
          </div>
        )}

        <ThemedText secondary className="text-xs">
          This is a simple demo checkout. Payment gateway integration is reference-only in this
          codebase.
        </ThemedText>
      </div>
    </ThemedView>
  );
}

