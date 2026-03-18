import React, { useState, useEffect } from 'react';
import { getToken } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function Know() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPros, setReviewPros] = useState('');
  const [reviewCons, setReviewCons] = useState('');
  const [reviewSummary, setReviewSummary] = useState('');
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`${API_BASE}/job/know/companies${q}`)
      .then((res) => res.ok ? res.json() : [])
      .then(setCompanies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  const openCompany = (slug: string) => {
    setShowReviewForm(false);
    setReviewError(null);
    fetch(`${API_BASE}/job/know/companies/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
      .then(setSelectedCompany)
      .catch((e) => setError(e.message));
  };

  const submitReview = async () => {
    if (!selectedCompany?.id) return;
    const token = getToken();
    if (!token) {
      setReviewError('You must be logged in to submit a review.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/companies/${selectedCompany.id}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewRating,
          pros: reviewPros.trim() || undefined,
          cons: reviewCons.trim() || undefined,
          summary: reviewSummary.trim() || undefined,
          isAnonymous: reviewAnonymous,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit review.');
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewPros('');
      setReviewCons('');
      setReviewSummary('');
      setReviewAnonymous(false);
      openCompany(selectedCompany.slug);
    } catch (e: any) {
      setReviewError(e.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading && !selectedCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Know...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">MOxE Know</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Company research, reviews, salary insights, and career resources.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white mb-6"
      />
      {selectedCompany ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <button
            onClick={() => setSelectedCompany(null)}
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-4"
          >
            ← Back to list
          </button>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
            {selectedCompany.name}
          </h3>
          {selectedCompany.website && (
            <a
              href={selectedCompany.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 text-sm"
            >
              {selectedCompany.website}
            </a>
          )}
          {selectedCompany.description && (
            <p className="mt-3 text-slate-600 dark:text-slate-400">{selectedCompany.description}</p>
          )}
          {selectedCompany.reviews?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-slate-800 dark:text-white">Reviews</h4>
              <div className="mt-2 space-y-2">
                {selectedCompany.reviews.slice(0, 10).map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm"
                  >
                    <span className="text-amber-500">{'★'.repeat(r.rating || 0)}</span>
                    {r.summary && <p className="mt-1">{r.summary}</p>}
                    {r.pros && <p className="mt-1 text-green-600 dark:text-green-400">Pros: {r.pros}</p>}
                    {r.cons && <p className="mt-1 text-red-600 dark:text-red-400">Cons: {r.cons}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
            >
              Add your review
            </button>
          </div>
          {showReviewForm && (
            <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
              <h4 className="font-medium text-slate-800 dark:text-white mb-3">Write a review</h4>
              {reviewError && (
                <p className="text-red-500 text-sm mb-2">{reviewError}</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Rating (1–5)</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Summary</label>
                  <input
                    type="text"
                    value={reviewSummary}
                    onChange={(e) => setReviewSummary(e.target.value)}
                    placeholder="Short summary"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Pros</label>
                  <textarea
                    value={reviewPros}
                    onChange={(e) => setReviewPros(e.target.value)}
                    placeholder="What did you like?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Cons</label>
                  <textarea
                    value={reviewCons}
                    onChange={(e) => setReviewCons(e.target.value)}
                    placeholder="What could be better?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={reviewAnonymous}
                    onChange={(e) => setReviewAnonymous(e.target.checked)}
                  />
                  Post anonymously
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReviewForm(false); setReviewError(null); }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.length === 0 ? (
            <p className="text-slate-500 col-span-2">No companies found.</p>
          ) : (
            companies.map((c) => (
              <button
                key={c.id}
                onClick={() => openCompany(c.slug)}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <div className="font-medium text-slate-800 dark:text-white">{c.name}</div>
                {c.industry && (
                  <div className="text-sm text-slate-500 mt-1">{c.industry}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
