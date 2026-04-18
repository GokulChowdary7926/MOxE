import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiBase } from '../../services/api';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

type WishItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    images?: string[] | null;
    account?: { username?: string | null } | null;
  };
};

export default function StoreWishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/commerce/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error((data as any).error || 'Failed to load wishlist');
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load wishlist');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function remove(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/commerce/wishlist/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((w) => w.productId !== productId));
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-slate-950 pb-20">
      <div className="max-w-5xl mx-auto p-3">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-[#0052CC] font-semibold">
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-2">Wishlist</h1>
        {loading ? <p className="text-sm text-slate-500 mt-3">Loading wishlist...</p> : null}
        {error ? <p className="text-sm text-rose-500 mt-3">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-slate-500 mt-3">Your wishlist is empty.</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map((w) => (
            <article key={w.id} className="rounded-lg border border-[#DFE1E6] dark:border-slate-800 p-2 bg-white dark:bg-slate-900">
              <Link to={`/store/p/${encodeURIComponent(w.product.id)}`} className="block">
                <div className="aspect-square rounded-md bg-[#f6f7fb] dark:bg-slate-800 overflow-hidden">
                  {w.product.images?.[0] ? (
                    <img src={ensureAbsoluteMediaUrl(w.product.images[0])} alt={w.product.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[28px]">
                  {w.product.name}
                </p>
              </Link>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                by @{w.product.account?.username || 'seller'}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#172B4D] dark:text-slate-100">
                ₹{Number(w.product.price || 0).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => remove(w.productId)}
                className="mt-2 w-full rounded-md border border-rose-300 text-rose-500 text-[11px] py-1.5"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

