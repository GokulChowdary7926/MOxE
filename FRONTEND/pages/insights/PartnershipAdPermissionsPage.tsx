import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';

type Application = {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  campaign: { id: string; title: string };
  creator: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null };
};

export default function PartnershipAdPermissionsPage() {
  const location = useLocation();
  const backTo = (location.state as { backTo?: string })?.backTo ?? '/insights/branded-content';
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<Application[]>([]);
  const [approved, setApproved] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/creator/brand-applications?status=PENDING`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${base}/creator/brand-applications?status=ACCEPTED`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([pendingRes, approvedRes]) => {
      setPending(Array.isArray(pendingRes.applications) ? pendingRes.applications : []);
      setApproved(Array.isArray(approvedRes.applications) ? approvedRes.applications : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (applicationId: string) => {
    const token = getToken();
    if (!token) return;
    setActionId(applicationId);
    try {
      const res = await fetch(`${getApiBase()}/creator/brand-applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== applicationId));
        const data = await res.json();
        setApproved((prev) => [{ ...data, campaign: data.campaign || {}, creator: data.creator || {} }, ...prev]);
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (applicationId: string) => {
    const token = getToken();
    if (!token) return;
    setActionId(applicationId);
    try {
      const res = await fetch(`${getApiBase()}/creator/brand-applications/${applicationId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPending((prev) => prev.filter((a) => a.id !== applicationId));
    } finally {
      setActionId(null);
    }
  };

  const pendingText = 'These accounts are requesting permissions to create new partnership ads with you.';
  const approvedText = 'These accounts can create new partnership ads with you.';
  const list = tab === 'pending' ? pending : approved;
  const filtered = search.trim()
    ? list.filter(
        (a) =>
          (a.creator?.username || '').toLowerCase().includes(search.trim().toLowerCase()) ||
          (a.creator?.displayName || '').toLowerCase().includes(search.trim().toLowerCase()) ||
          (a.campaign?.title || '').toLowerCase().includes(search.trim().toLowerCase()),
      )
    : list;

  return (
    <SettingsPageShell title="Partnership ad permissions" backTo={backTo}>
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
      </div>
      <div className="flex border-b border-[#262626]">
        <button type="button" onClick={() => setTab('pending')} className={`flex-1 py-3 text-sm font-semibold ${tab === 'pending' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373] border-b-2 border-transparent'}`}>
          Pending
        </button>
        <button type="button" onClick={() => setTab('approved')} className={`flex-1 py-3 text-sm font-semibold ${tab === 'approved' ? 'text-white border-b-2 border-[#0095f6]' : 'text-[#737373] border-b-2 border-transparent'}`}>
          Approved
        </button>
      </div>
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-2">{tab === 'pending' ? pendingText : approvedText}</p>
        <Link to="/settings/help" className="text-[#0095f6] text-sm font-medium">How it works</Link>
        {loading ? (
          <div className="mt-6 text-[#737373] text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12">
            <p className="text-[#737373] text-sm text-center">{tab === 'pending' ? 'No pending requests.' : 'No approved accounts yet.'}</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#262626] border border-[#363636]">
                <div className="flex items-center gap-3 min-w-0">
                  {a.creator?.profilePhoto ? (
                    <img src={a.creator.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#363636] shrink-0 flex items-center justify-center text-white text-sm font-medium">
                      {(a.creator?.displayName || a.creator?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">@{a.creator?.username}</p>
                    {a.creator?.displayName && <p className="text-[#a8a8a8] text-xs truncate">{a.creator.displayName}</p>}
                    {a.campaign?.title && <p className="text-[#737373] text-xs mt-0.5">Campaign: {a.campaign.title}</p>}
                    {a.message && <p className="text-[#a8a8a8] text-xs mt-1 truncate">{a.message}</p>}
                  </div>
                </div>
                {tab === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(a.id)}
                      disabled={actionId === a.id}
                      className="px-3 py-1.5 rounded-lg bg-[#0095f6] text-white text-sm font-medium disabled:opacity-50"
                    >
                      {actionId === a.id ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(a.id)}
                      disabled={actionId === a.id}
                      className="px-3 py-1.5 rounded-lg border border-[#363636] text-[#a8a8a8] text-sm disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
