import React, { useEffect, useState } from 'react';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { Link } from 'react-router-dom';
import { ACCENT } from '../../constants/designSystem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Company = { id: string; name: string } | null;
type JobPosting = {
  id: string;
  title: string;
  status: string;
  location?: string | null;
  locationType?: string | null;
  company?: Company;
  companyName?: string | null;
  applicationCount?: number;
  createdAt: string;
  postedBy?: { id: string; username: string | null; displayName: string | null } | null;
};

export default function JobHub() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'my'>('open');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    const status = filter === 'my' ? 'ALL' : filter === 'open' ? 'OPEN' : 'OPEN';
    const myOnly = filter === 'my';
    fetch(
      `${API_BASE}/job/track/jobs?status=${status}&myOnly=${myOnly}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load jobs');
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const jobAccent = ACCENT.job; // #8A2BE2 purple

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader title="Job Hub" className="border-b border-[#262626]" />
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* Account-specific: Professional block / executive */}
        <section className="rounded-xl border border-[#363636] p-4 bg-[#262626]" style={{ borderLeftColor: jobAccent, borderLeftWidth: 4 }}>
          <ThemedText className="font-semibold text-white mb-2" style={{ color: jobAccent }}>Professional</ThemedText>
          <p className="text-sm text-[#a8a8a8] mb-2">Manage your job presence and applications.</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/profile"
              className="px-3 py-2 rounded-lg text-sm font-medium text-white border border-[#363636]"
              style={{ backgroundColor: jobAccent }}
            >
              Profile
            </Link>
            <span className="px-3 py-2 rounded-lg text-sm font-medium bg-[#363636] text-[#a8a8a8]">
              Open to opportunities
            </span>
          </div>
        </section>

        <ThemedText className="font-semibold text-white">Job list</ThemedText>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'open' as const, label: 'Open jobs' },
            { key: 'my' as const, label: 'My jobs' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                filter === key ? 'text-white' : 'bg-[#262626] border-[#363636] text-white'
              }`}
              style={filter === key ? { backgroundColor: jobAccent, borderColor: jobAccent } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
        {loading && <ThemedText secondary>Loading jobs…</ThemedText>}
        {error && <ThemedText className="text-red-500">{error}</ThemedText>}
        {!loading && !error && jobs.length === 0 && (
          <ThemedText secondary>No jobs found. Post a job or browse open roles.</ThemedText>
        )}
        {!loading && !error && jobs.length > 0 && (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="p-3 rounded-lg border border-[#363636] bg-[#262626] hover:border-[#8A2BE2]/50"
              >
                <Link to={`/job/${job.id}`} className="block">
                  <ThemedText className="font-medium">{job.title}</ThemedText>
                  <ThemedText secondary className="text-sm mt-0.5">
                    {job.company?.name ?? job.companyName ?? 'Company'} · {job.status}
                    {job.location && ` · ${job.location}`}
                    {job.applicationCount != null && ` · ${job.applicationCount} applications`}
                  </ThemedText>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ThemedView>
  );
}
