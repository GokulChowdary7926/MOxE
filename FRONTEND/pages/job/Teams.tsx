import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type JobTeamMember = {
  id: string;
  memberId: string;
  role: string;
  joinedAt: string;
  member: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto?: string | null;
  };
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Teams() {
  const [members, setMembers] = useState<JobTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [inviteAccountId, setInviteAccountId] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const headers = useAuthHeaders();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/teams`, { headers });
      if (!res.ok) throw new Error('Failed to load team');
      const data = (await res.json()) as JobTeamMember[];
      setMembers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteAccountId.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/teams/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          memberAccountId: inviteAccountId.trim(),
          role: inviteRole,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to invite member');
      }
      setInviteAccountId('');
      setInviteRole('MEMBER');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: JobTeamMember, role: string) => {
    if (!role || role === member.role) return;
    setUpdatingMemberId(member.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/teams/${member.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update member');
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to update member');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async (member: JobTeamMember) => {
    if (!window.confirm(`Remove ${member.member.displayName || member.member.username} from the Job team?`)) {
      return;
    }
    setRemovingMemberId(member.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/teams/${member.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to remove member');
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const ROLE_OPTIONS = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE TEAMS
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage who can collaborate in your Job workspace and their roles.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleInvite}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 text-xs"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Invite member
          </div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Member account ID"
            value={inviteAccountId}
            onChange={(e) => setInviteAccountId(e.target.value)}
          />
          <select
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="w-full mt-1 inline-flex justify-center items-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
        </form>
      </div>

      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Team members
          </div>
          {loading && members.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              Loading team…
            </div>
          )}
          {!loading && members.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              No team members yet. Invite collaborators on the left.
            </div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] text-slate-700 dark:text-slate-200 overflow-hidden">
                    {m.member.profilePhoto ? (
                      <img
                        src={m.member.profilePhoto}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(m.member.displayName || m.member.username || '?')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                      {m.member.displayName || m.member.username}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      @{m.member.username} · Joined{' '}
                      {new Date(m.joinedAt).toLocaleDateString([], {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-900 dark:text-slate-100"
                    value={m.role}
                    disabled={updatingMemberId === m.id}
                    onChange={(e) => handleRoleChange(m, e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={removingMemberId === m.id}
                    onClick={() => handleRemove(m)}
                    className="inline-flex items-center justify-center rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingMemberId === m.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

