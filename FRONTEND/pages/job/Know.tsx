import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from '../../services/api';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

function KnowHome() {
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
        <p className={JOB_MOBILE.meta}>Loading Know…</p>
      </div>
    );
  }

  return (
    <JobPageContent
      title="MOxE Know"
      description="Company research, reviews, salary insights, and career resources."
      error={error}
    >
      <input
        type="text"
        placeholder="Search companies…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${JOB_MOBILE.input} mb-4`}
        aria-label="Search companies"
      />
      {selectedCompany ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedCompany(null)}
            className={JOB_MOBILE.btnLink}
          >
            ← Back to list
          </button>
          <JobCard>
            <h2 className="text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
              {selectedCompany.name}
            </h2>
            {selectedCompany.website && (
              <a
                href={selectedCompany.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0052CC] dark:text-[#2684FF] text-sm mt-1 block break-all"
              >
                {selectedCompany.website}
              </a>
            )}
            {selectedCompany.description && (
              <p className={`mt-3 text-sm ${JOB_MOBILE.meta}`}>{selectedCompany.description}</p>
            )}
          </JobCard>
          {selectedCompany.reviews?.length > 0 && (
            <JobCard>
              <p className={`${JOB_MOBILE.label} mb-2`}>Reviews</p>
              <div className="space-y-3">
                {selectedCompany.reviews.slice(0, 10).map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-[#F4F5F7] dark:bg-[#2C333A] text-sm"
                  >
                    <span className="text-amber-500">{'★'.repeat(r.rating || 0)}</span>
                    {r.summary && <p className="mt-1 text-[#172B4D] dark:text-[#E6EDF3]">{r.summary}</p>}
                    {r.pros && <p className="mt-1 text-green-600 dark:text-green-400">Pros: {r.pros}</p>}
                    {r.cons && <p className="mt-1 text-red-600 dark:text-red-400">Cons: {r.cons}</p>}
                  </div>
                ))}
              </div>
            </JobCard>
          )}
          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            className={JOB_MOBILE.btnPrimary}
          >
            Add your review
          </button>
          {showReviewForm && (
            <JobCard className="mt-4">
              <h3 className="font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-3">Write a review</h3>
              {reviewError && <p className={`${JOB_MOBILE.error} mb-3`}>{reviewError}</p>}
              <div className="space-y-3">
                <div>
                  <label className={`block ${JOB_MOBILE.label} mb-1`}>Rating (1–5)</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className={JOB_MOBILE.input}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block ${JOB_MOBILE.label} mb-1`}>Summary</label>
                  <input
                    type="text"
                    value={reviewSummary}
                    onChange={(e) => setReviewSummary(e.target.value)}
                    placeholder="Short summary"
                    className={JOB_MOBILE.input}
                  />
                </div>
                <div>
                  <label className={`block ${JOB_MOBILE.label} mb-1`}>Pros</label>
                  <textarea
                    value={reviewPros}
                    onChange={(e) => setReviewPros(e.target.value)}
                    placeholder="What did you like?"
                    rows={2}
                    className={JOB_MOBILE.input}
                  />
                </div>
                <div>
                  <label className={`block ${JOB_MOBILE.label} mb-1`}>Cons</label>
                  <textarea
                    value={reviewCons}
                    onChange={(e) => setReviewCons(e.target.value)}
                    placeholder="What could be better?"
                    rows={2}
                    className={JOB_MOBILE.input}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#5E6C84] dark:text-[#8C9BAB] min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={reviewAnonymous}
                    onChange={(e) => setReviewAnonymous(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Post anonymously
                </label>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className={JOB_MOBILE.btnPrimary}
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReviewForm(false); setReviewError(null); }}
                  className={JOB_MOBILE.btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </JobCard>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {companies.length === 0 ? (
            <p className={JOB_MOBILE.meta}>No companies found.</p>
          ) : (
            companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openCompany(c.slug)}
                className={`w-full ${JOB_MOBILE.listRow} ${JOB_MOBILE.card} ${JOB_MOBILE.cardPadding} text-left`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3]">{c.name}</div>
                  {c.industry && <div className={`text-sm ${JOB_MOBILE.meta} mt-0.5`}>{c.industry}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </JobPageContent>
  );
}

export default function Know() {
  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<KnowHome />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
