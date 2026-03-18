import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

type JobIntegration = {
  id: string | null;
  provider: string;
  displayName: string;
  description: string;
  status: IntegrationStatus;
  connectedAt: string | null;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Integration() {
  const [items, setItems] = useState<JobIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const headers = useAuthHeaders();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/integrations`, { headers });
      if (!res.ok) throw new Error('Failed to load integrations');
      const data = (await res.json()) as JobIntegration[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (integration: JobIntegration) => {
    setBusyProvider(integration.provider);
    setError(null);
    try {
      const path =
        integration.status === 'CONNECTED'
          ? `${API_BASE}/job/integrations/${integration.provider}/disconnect`
          : `${API_BASE}/job/integrations/${integration.provider}/connect`;
      const res = await fetch(path, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update integration');
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to update integration');
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE INTEGRATION
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Connect your Job workspace to code, issue tracking, docs, and chat tools.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-1.5">
          <p className="text-slate-600 dark:text-slate-300">
            These toggles record integration preferences for your Job account. Actual OAuth / token
            flows should be wired later to the respective providers.
          </p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          {loading && items.length === 0 && (
            <div className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
              Loading integrations…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
              No integrations available.
            </div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((i) => {
              const connected = i.status === 'CONNECTED';
              const isBusy = busyProvider === i.provider;
              return (
                <div
                  key={i.provider}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {i.displayName}
                      </span>
                      {connected && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {i.description}
                    </p>
                    {i.connectedAt && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Since{' '}
                        {new Date(i.connectedAt).toLocaleDateString([], {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggle(i)}
                    className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                      connected
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isBusy ? 'Saving…' : connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

