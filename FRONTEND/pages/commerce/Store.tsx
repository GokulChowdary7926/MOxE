import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Store as StoreIcon, Sparkles, BadgePercent, Heart } from 'lucide-react';
import { getApiBase } from '../../services/api';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

type CatalogItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images?: string[] | null;
  account?: { id: string; username: string; displayName?: string | null } | null;
};

type SellerRating = { rating: number | null; reviewsCount: number };

export default function StorePage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const accountType = String(account?.accountType || 'PERSONAL').toUpperCase();
  const isBusiness = accountType === 'BUSINESS';

  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [category, setCategory] = useState<'all' | 'mobiles' | 'fashion' | 'home' | 'gifts'>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistBusyId, setWishlistBusyId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sellerRatings, setSellerRatings] = useState<Record<string, SellerRating>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${getApiBase()}/commerce/catalog`);
        if (search.trim()) url.searchParams.set('q', search.trim());
        url.searchParams.set('category', category);
        url.searchParams.set('sort', sortBy);
        url.searchParams.set('dealsOnly', String(showDealsOnly));
        if (minPrice.trim() && !Number.isNaN(Number(minPrice))) url.searchParams.set('minPrice', String(Number(minPrice)));
        if (maxPrice.trim() && !Number.isNaN(Number(maxPrice))) url.searchParams.set('maxPrice', String(Number(maxPrice)));
        url.searchParams.set('limit', '36');
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any).error || 'Failed to load store catalog.');
        if (!cancelled) {
          setItems(Array.isArray((data as any).items) ? (data as any).items : []);
          setNextCursor(typeof (data as any).nextCursor === 'string' ? (data as any).nextCursor : null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load store catalog.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [search, category, sortBy, showDealsOnly, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    async function loadWishlist() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${getApiBase()}/commerce/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ([]));
        if (!res.ok || cancelled) return;
        const ids = new Set<string>((Array.isArray(data) ? data : []).map((x: any) => x.productId).filter(Boolean));
        setWishlistIds(ids);
      } catch {
        // ignore
      }
    }
    void loadWishlist();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCartCount() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${getApiBase()}/commerce/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const items = Array.isArray((data as any).items) ? (data as any).items : [];
        const count = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
        setCartCount(count);
      } catch {
        // ignore
      }
    }
    void loadCartCount();
    return () => {
      cancelled = true;
    };
  }, [addingId]);

  const featured = useMemo(() => items.slice(0, 8), [items]);
  const deals = useMemo(
    () => items.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 8),
    [items],
  );
  const visibleItems = useMemo(() => items, [items]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const url = new URL(`${getApiBase()}/commerce/catalog`);
      if (search.trim()) url.searchParams.set('q', search.trim());
      url.searchParams.set('category', category);
      url.searchParams.set('sort', sortBy);
      url.searchParams.set('dealsOnly', String(showDealsOnly));
      if (minPrice.trim() && !Number.isNaN(Number(minPrice))) url.searchParams.set('minPrice', String(Number(minPrice)));
      if (maxPrice.trim() && !Number.isNaN(Number(maxPrice))) url.searchParams.set('maxPrice', String(Number(maxPrice)));
      url.searchParams.set('cursor', nextCursor);
      url.searchParams.set('limit', '36');
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || 'Failed to load more products.');
      const more = Array.isArray((data as any).items) ? (data as any).items : [];
      setItems((prev) => [...prev, ...more.filter((m: any) => !prev.some((p) => p.id === m.id))]);
      setNextCursor(typeof (data as any).nextCursor === 'string' ? (data as any).nextCursor : null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load more products.');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node) return;
    if (!nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loadingMore || loading) return;
        void loadMore();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, loading, search, category, sortBy, showDealsOnly, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    const sellerIds = Array.from(
      new Set(
        items
          .map((p) => p.account?.id)
          .filter((id): id is string => typeof id === 'string' && !!id),
      ),
    ).filter((id) => !sellerRatings[id]);
    if (!sellerIds.length) return;

    async function loadRatings() {
      try {
        const pairs = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const res = await fetch(
              `${getApiBase()}/commerce/reviews/aggregate?sellerId=${encodeURIComponent(sellerId)}`,
            );
            const data = await res.json().catch(() => ({}));
            return [
              sellerId,
              {
                rating:
                  typeof (data as any)?.rating === 'number'
                    ? (data as any).rating
                    : null,
                reviewsCount: Number((data as any)?.reviewsCount || 0),
              } as SellerRating,
            ] as const;
          }),
        );
        if (cancelled) return;
        setSellerRatings((prev) => {
          const next = { ...prev };
          for (const [id, stats] of pairs) next[id] = stats;
          return next;
        });
      } catch {
        // ignore rating fetch failures
      }
    }
    void loadRatings();
    return () => {
      cancelled = true;
    };
  }, [items, sellerRatings]);

  async function toggleWishlist(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setWishlistBusyId(productId);
    const has = wishlistIds.has(productId);
    try {
      const res = await fetch(`${getApiBase()}/commerce/wishlist/${encodeURIComponent(productId)}`, {
        method: has ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Wishlist update failed');
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(productId);
        else next.add(productId);
        return next;
      });
    } catch (e: any) {
      setError(e?.message || 'Wishlist update failed');
    } finally {
      setWishlistBusyId(null);
    }
  }

  async function addToCart(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAddingId(productId);
    try {
      const res = await fetch(`${getApiBase()}/commerce/cart/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || 'Could not add to cart');
      navigate('/checkout');
    } catch (e: any) {
      setError(e?.message || 'Could not add to cart');
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-[#DFE1E6] dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-lg border border-[#DFE1E6] dark:border-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Back"
          >
            ←
          </button>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(q);
              }}
              placeholder="Search for products, brands and more"
              className="w-full rounded-lg border border-[#DFE1E6] dark:border-slate-700 bg-[#f8f9fb] dark:bg-slate-800 py-2 pl-9 pr-20 text-sm text-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setSearch(q)}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-[#0052CC] text-white text-xs"
            >
              Search
            </button>
          </div>
          <Link
            to="/store/wishlist"
            className="h-9 w-9 rounded-lg border border-[#DFE1E6] dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" />
          </Link>
          <Link
            to="/checkout"
            className="relative h-9 w-9 rounded-lg border border-[#DFE1E6] dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
            aria-label="Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0052CC] text-white text-[10px] leading-4 text-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          {isBusiness && (
            <Link
              to="/commerce"
              className="h-9 px-3 rounded-lg bg-[#0052CC] text-white text-xs inline-flex items-center gap-1"
              aria-label="Seller console"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              Sell
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-3 space-y-3">
        <section className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-r from-[#0052CC] to-[#1b77ff] text-white p-4">
            <p className="text-xs opacity-90">MOxE Store</p>
            <h2 className="text-lg font-semibold mt-1">Top picks for you</h2>
            <p className="text-xs mt-1 opacity-90">Fast checkout, trusted business sellers.</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track and reorder</p>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">My Orders</h2>
            </div>
            <Link to="/commerce/orders" className="text-xs text-[#0052CC] font-semibold">
              Open
            </Link>
          </div>
        </section>

        <section className="rounded-xl bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-800 p-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'mobiles', label: 'Mobiles' },
              { id: 'fashion', label: 'Fashion' },
              { id: 'home', label: 'Home' },
              { id: 'gifts', label: 'Gifts' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] border ${
                  category === c.id
                    ? 'bg-[#0052CC] text-white border-[#0052CC]'
                    : 'border-[#DFE1E6] dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgePercent className="w-4 h-4 text-[#0052CC]" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Best Deals</h3>
          </div>
          {deals.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No deal products right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {deals.map((p) => (
                <article key={`deal-${p.id}`} className="rounded-lg border border-[#DFE1E6] dark:border-slate-800 p-2">
                  <div className="aspect-square rounded-md bg-[#f6f7fb] dark:bg-slate-800 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={ensureAbsoluteMediaUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-800 dark:text-slate-100 line-clamp-1">{p.name}</p>
                  <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-100">
                    ₹{Number(p.price || 0).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#0052CC]" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">All Products</h3>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDealsOnly((v) => !v)}
              className={`px-2.5 py-1 rounded-full text-[11px] border ${
                showDealsOnly
                  ? 'bg-[#0052CC] text-white border-[#0052CC]'
                  : 'border-[#DFE1E6] dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              Deals only
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-full text-[11px] border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <input
              type="number"
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min ₹"
              className="w-24 px-2.5 py-1 rounded-full text-[11px] border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            />
            <input
              type="number"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max ₹"
              className="w-24 px-2.5 py-1 rounded-full text-[11px] border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            />
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading products...</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : featured.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {visibleItems.map((p) => (
                <article
                  key={p.id}
                  className="rounded-lg border border-[#DFE1E6] dark:border-slate-800 p-2 bg-white dark:bg-slate-900"
                >
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      aria-label={wishlistIds.has(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      onClick={() => toggleWishlist(p.id)}
                      disabled={wishlistBusyId === p.id}
                      className={`h-7 w-7 rounded-full border flex items-center justify-center ${
                        wishlistIds.has(p.id)
                          ? 'border-rose-300 text-rose-500'
                          : 'border-[#DFE1E6] dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlistIds.has(p.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <Link to={`/store/p/${encodeURIComponent(p.id)}`} className="block">
                    <div className="aspect-square rounded-md bg-[#f6f7fb] dark:bg-slate-800 overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={ensureAbsoluteMediaUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                  </Link>
                  <p className="mt-1 text-[11px] text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[28px]">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    by @{p.account?.username || 'seller'}
                  </p>
                  {p.account?.id && sellerRatings[p.account.id]?.rating ? (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ★ {sellerRatings[p.account.id].rating?.toFixed(1)} ({sellerRatings[p.account.id].reviewsCount})
                    </p>
                  ) : null}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs font-semibold text-[#172B4D] dark:text-slate-100">
                      ₹{Number(p.price || 0).toLocaleString()}
                    </span>
                    {p.compareAtPrice && p.compareAtPrice > p.price ? (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{Number(p.compareAtPrice).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={addingId === p.id}
                    onClick={() => addToCart(p.id)}
                    className="mt-2 w-full rounded-md bg-[#0052CC] text-white text-[11px] font-medium py-1.5 disabled:opacity-60"
                  >
                    {addingId === p.id ? 'Adding...' : 'Add to cart'}
                  </button>
                </article>
              ))}
            </div>
          )}
          {!loading && !error && nextCursor && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg border border-[#DFE1E6] dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
          {nextCursor ? <div ref={loadMoreSentinelRef} className="h-2 w-full" /> : null}
        </section>
      </main>
    </div>
  );
}

