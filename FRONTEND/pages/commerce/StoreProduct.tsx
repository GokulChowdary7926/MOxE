import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { getApiBase } from '../../services/api';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images?: string[] | null;
  account?: { id: string; username: string; displayName?: string | null } | null;
};

type SellerRating = { rating: number | null; reviewsCount: number };

export default function StoreProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [sellerRating, setSellerRating] = useState<SellerRating | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/commerce/catalog/${encodeURIComponent(productId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any).error || 'Product not found');
        if (!cancelled) setItem(data as Product);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    async function loadSellerRating() {
      const sellerId = item?.account?.id;
      if (!sellerId) {
        setSellerRating(null);
        return;
      }
      try {
        const res = await fetch(
          `${getApiBase()}/commerce/reviews/aggregate?sellerId=${encodeURIComponent(sellerId)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setSellerRating({
          rating: typeof (data as any)?.rating === 'number' ? (data as any).rating : null,
          reviewsCount: Number((data as any)?.reviewsCount || 0),
        });
      } catch {
        // ignore
      }
    }
    void loadSellerRating();
    return () => {
      cancelled = true;
    };
  }, [item?.account?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadWishlistState() {
      const token = localStorage.getItem('token');
      if (!token || !productId) return;
      try {
        const res = await fetch(`${getApiBase()}/commerce/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ([]));
        if (!res.ok || cancelled) return;
        const has = (Array.isArray(data) ? data : []).some((x: any) => x.productId === productId);
        setInWishlist(has);
      } catch {
        // ignore
      }
    }
    void loadWishlistState();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const discountPct = useMemo(() => {
    if (!item?.compareAtPrice || item.compareAtPrice <= item.price) return null;
    return Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100);
  }, [item]);

  async function addToCart() {
    if (!item) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/commerce/cart/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || 'Could not add to cart');
      navigate('/checkout');
    } catch (e: any) {
      setError(e?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  }

  async function toggleWishlist() {
    if (!item) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setWishlistBusy(true);
    try {
      const res = await fetch(`${getApiBase()}/commerce/wishlist/${encodeURIComponent(item.id)}`, {
        method: inWishlist ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Wishlist update failed');
      setInWishlist((v) => !v);
    } catch (e: any) {
      setError(e?.message || 'Wishlist update failed');
    } finally {
      setWishlistBusy(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#f1f3f6] p-4 text-slate-600">Loading product...</div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] p-4">
        <p className="text-rose-500">{error || 'Product not found.'}</p>
        <Link to="/store" className="text-[#0052CC] text-sm font-semibold mt-2 inline-block">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-slate-950 pb-20">
      <div className="max-w-5xl mx-auto p-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 text-sm text-[#0052CC] font-semibold"
        >
          ← Back
        </button>

        <div className="rounded-xl border border-[#DFE1E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-3 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-[#f6f7fb] dark:bg-slate-800 overflow-hidden aspect-square">
            {item.images?.[0] ? <img src={ensureAbsoluteMediaUrl(item.images[0])} alt={item.name} className="w-full h-full object-cover" /> : null}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{item.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sold by @{item.account?.username || 'seller'}
            </p>
            {sellerRating?.rating ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                ★ {sellerRating.rating.toFixed(1)} ({sellerRating.reviewsCount} reviews)
              </p>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl font-bold text-[#172B4D] dark:text-slate-100">
                ₹{Number(item.price || 0).toLocaleString()}
              </span>
              {item.compareAtPrice && item.compareAtPrice > item.price ? (
                <span className="text-sm text-slate-400 line-through">
                  ₹{Number(item.compareAtPrice).toLocaleString()}
                </span>
              ) : null}
              {discountPct ? (
                <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                  {discountPct}% off
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {item.description || 'No description provided.'}
            </p>
            {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishlistBusy}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
                  inWishlist
                    ? 'border-rose-300 text-rose-500'
                    : 'border-[#DFE1E6] dark:border-slate-700 text-slate-700 dark:text-slate-200'
                } disabled:opacity-60`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button
                type="button"
                onClick={addToCart}
                disabled={adding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-medium disabled:opacity-60"
              >
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to cart'}
              </button>
              <Link
                to="/checkout"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-[#DFE1E6] dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200"
              >
                Go to checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

