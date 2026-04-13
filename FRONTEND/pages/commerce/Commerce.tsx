import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ClipboardList, Search, Smartphone, Shirt, Home as HomeIcon, Gift } from 'lucide-react';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { getApiBase, getUploadUrl } from '../../services/api';

const API_BASE = getApiBase();

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images?: string[];
  inventory?: number | null;
  sku?: string | null;
  isActive?: boolean;
  isDigital?: boolean;
  createdAt?: string;
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
  } | null;
  items: {
    product: { id: string; name: string; images: string[] };
    quantity: number;
    priceAtPurchase: number;
  }[];
};

type SellerCoupon = {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
};

const defaultProductForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  images: [] as string[],
  inventory: '',
  sku: '',
  isDigital: false,
};

export default function Commerce() {
  const navigate = useNavigate();
  const cap = useAccountCapabilities();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [shopBannerUrl, setShopBannerUrl] = useState('');
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [shopUsername, setShopUsername] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [customDomainVerifiedAt, setCustomDomainVerifiedAt] = useState<boolean>(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingShopSettings, setSavingShopSettings] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SellerCoupon | null>(null);
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'PERCENT' as 'PERCENT' | 'FIXED',
    value: '',
    minOrder: '',
    expiresAt: '',
    usageLimit: '',
  });

  const [webinars, setWebinars] = useState<Array<{ id: string; topic: string; title: string; description?: string | null; url: string }>>([]);

  useEffect(() => {
    if (!cap.canCommerce) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    async function load() {
      try {
        const [prodRes, ordersRes, meRes, couponsRes, webinarsRes] = await Promise.all([
          fetch(`${API_BASE}/commerce/products`, { headers }),
          fetch(`${API_BASE}/commerce/orders`, { headers }),
          fetch(`${API_BASE}/accounts/me`, { headers }),
          fetch(`${API_BASE}/commerce/coupons`, { headers }),
          fetch(`${API_BASE}/commerce/webinars`),
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(Array.isArray(data) ? (data as Product[]) : []);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data) ? (data as SellerOrder[]) : []);
        }
        if (meRes.ok) {
          const data = await meRes.json();
          const acc = data?.account;
          if (acc) {
            setShopBannerUrl(acc.shopBannerUrl || '');
            setFeaturedProductIds(Array.isArray(acc.featuredProductIds) ? acc.featuredProductIds : []);
            setShopUsername(acc.username || '');
            setCustomDomain(acc.customDomain || '');
            setCustomDomainVerifiedAt(!!acc.customDomainVerifiedAt);
          }
        }
        if (couponsRes.ok) {
          const data = await couponsRes.json();
          setCoupons(Array.isArray(data) ? (data as SellerCoupon[]) : []);
        }
        if (webinarsRes.ok) {
          const data = await webinarsRes.json();
          setWebinars(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cap.canCommerce]);

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(defaultProductForm);
    setProductFormOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price ?? ''),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      images: p.images && p.images.length > 0 ? [...p.images] : [],
      inventory: p.inventory != null ? String(p.inventory) : '',
      sku: p.sku || '',
      isDigital: p.isDigital ?? false,
    });
    setProductFormOpen(true);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    const price = parseFloat(productForm.price);
    if (Number.isNaN(price) || price < 0) return;
    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        price,
        compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : undefined,
        images: productForm.images,
        inventory: productForm.inventory.trim() ? parseInt(productForm.inventory, 10) : undefined,
        sku: productForm.sku.trim() || undefined,
        isDigital: productForm.isDigital,
      };
      if (editingProduct) {
        const res = await fetch(`${API_BASE}/commerce/products/${encodeURIComponent(editingProduct.id)}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setProductFormOpen(false);
        }
      } else {
        const res = await fetch(`${API_BASE}/commerce/products`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProducts((prev) => [created, ...prev]);
          setProductFormOpen(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setSavingProduct(false);
    }
  }

  async function deleteProduct(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(productId);
    try {
      const res = await fetch(`${API_BASE}/commerce/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setFeaturedProductIds((prev) => prev.filter((id) => id !== productId));
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  function openAddCoupon() {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      type: 'PERCENT',
      value: '',
      minOrder: '',
      expiresAt: '',
      usageLimit: '',
    });
    setCouponFormOpen(true);
  }

  function openEditCoupon(c: SellerCoupon) {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code,
      type: c.type,
      value: String(c.value ?? ''),
      minOrder: c.minOrder != null ? String(c.minOrder) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
    });
    setCouponFormOpen(true);
  }

  async function handleCouponSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setCouponSaving(true);
    try {
      const payload: any = {
        code: couponForm.code.trim(),
        type: couponForm.type,
        value: Number(couponForm.value) || 0,
        minOrder: couponForm.minOrder.trim()
          ? Number(couponForm.minOrder.trim())
          : undefined,
        expiresAt: couponForm.expiresAt.trim()
          ? new Date(couponForm.expiresAt.trim())
          : undefined,
        usageLimit: couponForm.usageLimit.trim()
          ? Number(couponForm.usageLimit.trim())
          : undefined,
      };
      if (editingCoupon) {
        const res = await fetch(
          `${API_BASE}/commerce/coupons/${encodeURIComponent(editingCoupon.id)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: payload.type,
              value: payload.value,
              minOrder: payload.minOrder ?? null,
              expiresAt: payload.expiresAt ?? null,
              usageLimit: payload.usageLimit ?? null,
            }),
          },
        );
        if (res.ok) {
          const updated = await res.json();
          setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setCouponFormOpen(false);
        }
      } else {
        const res = await fetch(`${API_BASE}/commerce/coupons`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setCoupons((prev) => [created, ...prev]);
          setCouponFormOpen(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setCouponSaving(false);
    }
  }

  async function deleteCoupon(couponId: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE}/commerce/coupons/${encodeURIComponent(couponId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      }
    } catch {
      // ignore
    }
  }

  async function handleShopSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingShopSettings(true);
    try {
      const res = await fetch(`${API_BASE}/commerce/shop-settings`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopBannerUrl: shopBannerUrl.trim() || null,
          featuredProductIds,
          customDomain: customDomain.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.customDomain !== undefined) setCustomDomain(data.customDomain || '');
        if (data.customDomainVerifiedAt !== undefined) setCustomDomainVerifiedAt(!!data.customDomainVerifiedAt);
      }
    } catch {
      // ignore
    } finally {
      setSavingShopSettings(false);
    }
  }

  function toggleFeatured(productId: string) {
    setFeaturedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  async function uploadImage(file: File): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(getUploadUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function onProductImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setProductForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch {
      // ignore
    }
    e.target.value = '';
  }

  async function updateOrderStatus(orderId: string, status: 'SHIPPED' | 'DELIVERED') {
    const token = localStorage.getItem('token');
    if (!token) return;
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/commerce/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      }
    } catch {
      // ignore
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

  if (!cap.canCommerce) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-2">MOxE Store</h1>
        <p className="text-[#5E6C84] dark:text-slate-400 mb-4">
          Flipkart-style shopping hub: discover products, checkout fast, and track your orders.
        </p>

        <div className="mb-6 rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, brands and categories"
              className="w-full rounded-lg border border-[#DFE1E6] dark:border-slate-700 bg-[#F4F5F7] dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100"
              onFocus={() => {
                // Search is routed through Explore currently until a dedicated catalog endpoint is added.
                navigate('/explore');
              }}
              readOnly
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { icon: Smartphone, label: 'Mobiles' },
              { icon: Shirt, label: 'Fashion' },
              { icon: HomeIcon, label: 'Home' },
              { icon: Gift, label: 'Gifts' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate('/explore')}
                className="rounded-lg border border-[#DFE1E6] dark:border-slate-700 py-2 px-1 text-center hover:bg-[#F4F5F7] dark:hover:bg-slate-800"
              >
                <Icon className="w-4 h-4 mx-auto text-[#0052CC]" />
                <span className="block mt-1 text-[11px] text-[#172B4D] dark:text-slate-200">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/checkout"
            className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <ShoppingCart className="w-8 h-8 text-[#0052CC] flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-[#172B4D] dark:text-slate-100">Cart & Checkout</h2>
              <p className="text-[#5E6C84] dark:text-slate-400 text-sm">Review your cart and complete purchases</p>
            </div>
          </Link>
          <Link
            to="/commerce/orders"
            className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <ClipboardList className="w-8 h-8 text-[#0052CC] flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-[#172B4D] dark:text-slate-100">My Orders</h2>
              <p className="text-[#5E6C84] dark:text-slate-400 text-sm">Track your purchases and reorder</p>
            </div>
        </Link>
        </div>

        <div className="mt-8 p-4 bg-[#F4F5F7] dark:bg-slate-800 border border-[#DFE1E6] dark:border-slate-700 rounded-lg">
          <p className="text-[#5E6C84] dark:text-slate-400 text-sm">
            Products can be discovered in{' '}
            <Link to="/explore" className="text-[#0052CC] hover:underline font-medium">
              Explore
            </Link>{' '}
            and on posts with product tags.
            <span className="block mt-1 text-sm">Only Business accounts can sell on MOxE.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">Commerce</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage your MOxE Shop: products, orders, and shop settings.
          </p>
        </div>
        <Link
          to="/business-dashboard"
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          Business dashboard
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Store access</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Business accounts can both sell and buy in the MOxE Store.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/checkout"
            className="flex items-center gap-3 rounded-lg border border-[#DFE1E6] dark:border-slate-700 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-[#0052CC] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#172B4D] dark:text-slate-100">Buy products</p>
              <p className="text-xs text-[#5E6C84] dark:text-slate-400">Open cart and checkout</p>
            </div>
          </Link>
          <Link
            to="/commerce/orders"
            className="flex items-center gap-3 rounded-lg border border-[#DFE1E6] dark:border-slate-700 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <ClipboardList className="w-5 h-5 text-[#0052CC] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#172B4D] dark:text-slate-100">My purchases</p>
              <p className="text-xs text-[#5E6C84] dark:text-slate-400">Track buyer orders</p>
            </div>
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading commerce data…</p>
      ) : (
        <>
          {/* MOxE Website & Custom domain */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">MOxE Website</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Your shop has a public website. Products sync automatically.
            </p>
            {shopUsername && (
              <div className="mb-3">
                <span className={labelClass}>Default website</span>
                <a
                  href={`${window.location.origin}/shop/${encodeURIComponent(shopUsername)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
                >
                  https://{shopUsername}.moxe.store
                </a>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  (opens in-app shop for now)
                </span>
              </div>
            )}
            <div className="mb-3">
              <label className={labelClass}>Custom domain</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Use your own domain (e.g. www.yourstore.com). Add a CNAME record pointing to shop.moxe.store, then verify.
              </p>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="www.yourstore.com"
                className={inputClass}
              />
              {customDomainVerifiedAt && (
                <span className="inline-block mt-1 text-xs text-green-600 dark:text-green-400">Verified</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setSavingShopSettings(true);
                  fetch(`${API_BASE}/commerce/shop-settings`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      shopBannerUrl: shopBannerUrl.trim() || null,
                      featuredProductIds,
                      customDomain: customDomain.trim() || null,
                    }),
                  })
                    .then((res) => res.json().catch(() => ({})))
                    .then((data) => {
                      if (data.customDomain !== undefined) setCustomDomain(data.customDomain || '');
                      setCustomDomainVerifiedAt(!!data.customDomainVerifiedAt);
                    })
                    .finally(() => setSavingShopSettings(false));
                }}
                disabled={savingShopSettings}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium disabled:opacity-60"
              >
                {savingShopSettings ? 'Saving…' : 'Save domain'}
              </button>
              {customDomain.trim() && (
                <button
                  type="button"
                  disabled={verifyingDomain}
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    setVerifyingDomain(true);
                    try {
                      const res = await fetch(`${API_BASE}/commerce/custom-domain/verify`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && data.verified) setCustomDomainVerifiedAt(true);
                      else alert(data.error || 'Verification failed. Check your CNAME record.');
                    } finally {
                      setVerifyingDomain(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  {verifyingDomain ? 'Verifying…' : 'Verify domain'}
                </button>
              )}
            </div>
          </section>

          {/* Webinar library */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Webinar library</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Educational videos for sellers: photography, marketing, shipping, and more.
            </p>
            {webinars.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No webinars available yet. Check back later.</p>
            ) : (
              <ul className="space-y-2">
                {webinars.map((w) => (
                  <li key={w.id} className="flex items-start gap-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase shrink-0">{w.topic}</span>
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {w.title}
                    </a>
                    {w.description && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline"> — {w.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Shop settings */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Shop settings</h2>
            <form onSubmit={handleShopSettingsSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Shop banner URL</label>
                <input
                  type="url"
                  value={shopBannerUrl}
                  onChange={(e) => setShopBannerUrl(e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
                {shopBannerUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-24">
                    <img src={shopBannerUrl} alt="Banner preview" className="w-full h-24 object-cover" />
                  </div>
                )}
              </div>
              <div>
                <span className={labelClass}>Featured products</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Select products to highlight on your shop. Shown first on your public shop page.
                </p>
                {products.length === 0 ? (
                  <p className="text-sm text-slate-500">Add products first, then choose featured ones.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {products.map((p) => (
                      <label
                        key={p.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={featuredProductIds.includes(p.id)}
                          onChange={() => toggleFeatured(p.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                          {p.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={savingShopSettings}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {savingShopSettings ? 'Saving…' : 'Save shop settings'}
              </button>
            </form>
          </section>

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Products</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {products.length} product{products.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                >
                  Add product
                </button>
              </div>
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No products yet. Click &quot;Add product&quot; to create your first one.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Product</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Price</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Inventory</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 align-top">
                          <div className="flex items-center gap-2">
                            {p.images && p.images.length > 0 && (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                              />
                            )}
                            <div>
                              <div className="text-[13px] text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                {p.name}
                              </div>
                              {p.createdAt && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Added {new Date(p.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-[13px] text-slate-800 dark:text-slate-100">
                          ₹{Number(p.price ?? 0).toLocaleString()}
                          {p.compareAtPrice ? (
                            <span className="ml-1 text-[11px] text-slate-500 dark:text-slate-400 line-through">
                              ₹{Number(p.compareAtPrice).toLocaleString()}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top text-[13px] text-slate-800 dark:text-slate-100">
                          {p.inventory != null ? p.inventory : '—'}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px]">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] ${
                              p.isActive ?? true
                                ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300'
                                : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {p.isActive ?? true ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              disabled={deletingId === p.id}
                              className="px-2 py-1 rounded-lg border border-red-300 dark:border-red-700 text-[11px] text-red-700 dark:text-red-300 disabled:opacity-50"
                            >
                              {deletingId === p.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Coupons */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Coupons
              </h2>
              <button
                type="button"
                onClick={openAddCoupon}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                New coupon
              </button>
            </div>
            {coupons.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No coupons yet. Create a discount code to share with buyers.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Value</th>
                      <th className="px-3 py-2 text-right">Min order</th>
                      <th className="px-3 py-2 text-right">Usage</th>
                      <th className="px-3 py-2 text-right">Expires</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >
                        <td className="px-3 py-2 font-mono text-[11px]">{c.code}</td>
                        <td className="px-3 py-2">
                          {c.type === 'PERCENT' ? 'Percent' : 'Fixed'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {c.type === 'PERCENT'
                            ? `${c.value}%`
                            : `$${c.value.toFixed(2)}`}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {c.minOrder != null ? `$${c.minOrder.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {c.usedCount != null || c.usageLimit != null
                            ? `${c.usedCount ?? 0}/${c.usageLimit ?? '∞'}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {c.expiresAt
                            ? new Date(c.expiresAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            type="button"
                            className="text-indigo-600 dark:text-indigo-300"
                            onClick={() => openEditCoupon(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-600 dark:text-red-400"
                            onClick={() => deleteCoupon(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {couponFormOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md bg-moxe-surface rounded-2xl border border-moxe-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-moxe-body">
                    {editingCoupon ? 'Edit coupon' : 'New coupon'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCouponFormOpen(false)}
                    className="text-moxe-textSecondary text-lg leading-none px-1"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCouponSubmit} className="space-y-3 text-sm">
                  <div>
                    <label className={labelClass}>Code</label>
                    <input
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm((f) => ({ ...f, code: e.target.value }))
                      }
                      disabled={!!editingCoupon}
                      className={inputClass}
                      placeholder="SUMMER10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className={labelClass}>Type</label>
                      <select
                        value={couponForm.type}
                        onChange={(e) =>
                          setCouponForm((f) => ({
                            ...f,
                            type: e.target.value as 'PERCENT' | 'FIXED',
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="PERCENT">Percent (%)</option>
                        <option value="FIXED">Fixed amount</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Value</label>
                      <input
                        type="number"
                        value={couponForm.value}
                        onChange={(e) =>
                          setCouponForm((f) => ({ ...f, value: e.target.value }))
                        }
                        className={inputClass}
                        placeholder={couponForm.type === 'PERCENT' ? '10' : '5.00'}
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className={labelClass}>Min order (optional)</label>
                      <input
                        type="number"
                        value={couponForm.minOrder}
                        onChange={(e) =>
                          setCouponForm((f) => ({ ...f, minOrder: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="25.00"
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Usage limit (optional)</label>
                      <input
                        type="number"
                        value={couponForm.usageLimit}
                        onChange={(e) =>
                          setCouponForm((f) => ({ ...f, usageLimit: e.target.value }))
                        }
                        className={inputClass}
                        placeholder="100"
                        min={0}
                        step="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Expires at (optional)</label>
                    <input
                      type="date"
                      value={couponForm.expiresAt}
                      onChange={(e) =>
                        setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setCouponFormOpen(false)}
                      className="px-3 py-1.5 text-xs rounded-moxe-md border border-moxe-border text-moxe-textSecondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={couponSaving}
                      className="px-3 py-1.5 text-xs rounded-moxe-md bg-indigo-600 text-white disabled:opacity-60"
                    >
                      {couponSaving ? 'Saving…' : 'Save coupon'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Orders */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Seller orders</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {orders.length} order{orders.length === 1 ? '' : 's'}
              </span>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No orders yet. When buyers check out from your MOxE Shop, they&apos;ll appear here.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Order</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Buyer</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Items</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Total</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 align-top">
                          <div className="text-[13px] text-slate-800 dark:text-slate-100">#{o.id.slice(0, 8)}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-[12px] text-slate-700 dark:text-slate-200">
                          {o.buyer?.displayName || o.buyer?.username || 'Customer'}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px] text-slate-700 dark:text-slate-200">
                          {o.items
                            .map((it) => `${it.product.name} ×${it.quantity}`)
                            .slice(0, 3)
                            .join(', ')}
                          {o.items.length > 3 ? ` +${o.items.length - 3} more` : ''}
                        </td>
                        <td className="px-3 py-2 align-top text-[13px] text-slate-800 dark:text-slate-100">
                          ₹{Number(o.total ?? 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 text-[11px] text-slate-600 dark:text-slate-300">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={
                                updatingOrderId === o.id || o.status === 'SHIPPED' || o.status === 'DELIVERED'
                              }
                              onClick={() => updateOrderStatus(o.id, 'SHIPPED')}
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200 disabled:opacity-50"
                            >
                              Mark shipped
                            </button>
                            <button
                              type="button"
                              disabled={updatingOrderId === o.id || o.status === 'DELIVERED'}
                              onClick={() => updateOrderStatus(o.id, 'DELIVERED')}
                              className="px-2 py-1 rounded-lg border border-emerald-400/70 text-[11px] text-emerald-700 dark:text-emerald-300 disabled:opacity-50"
                            >
                              Mark delivered
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Product create/edit modal */}
      {productFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editingProduct ? 'Edit product' : 'Add product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductFormOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-4 space-y-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={inputClass}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={inputClass}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Compare at price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onProductImageUpload}
                />
                <div className="flex flex-wrap gap-2 mb-2">
                  {productForm.images.map((url, i) => (
                    <div key={i} className="relative">
                      <img
                        src={url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((f) => ({
                            ...f,
                            images: f.images.filter((_, j) => j !== i),
                          }))
                        }
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200"
                >
                  Upload image
                </button>
                <p className="text-xs text-slate-500 mt-1">Or add an image URL below.</p>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    id="product-image-url"
                    placeholder="https://…"
                    className={inputClass}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('product-image-url') as HTMLInputElement | null;
                      const url = input?.value?.trim();
                      if (url) {
                        setProductForm((f) => ({ ...f, images: [...f.images, url] }));
                        if (input) input.value = '';
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Inventory</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.inventory}
                    onChange={(e) => setProductForm((f) => ({ ...f, inventory: e.target.value }))}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className={labelClass}>SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.isDigital}
                  onChange={(e) => setProductForm((f) => ({ ...f, isDigital: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">Digital product (no shipping)</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  {savingProduct ? 'Saving…' : editingProduct ? 'Update product' : 'Create product'}
                </button>
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
