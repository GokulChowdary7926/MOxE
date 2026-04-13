import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobDesignBiblePanel, JobToolBibleShell } from '../../components/job/bible';

type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

type JobIntegration = {
  id: string | null;
  provider: string;
  displayName: string;
  description: string;
  status: IntegrationStatus;
  connectedAt: string | null;
};

export default function Integration() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<JobIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<JobIntegration[]>('job/integrations');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** OAuth return: strip query params and show result. */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const ok = q.get('integration_success');
    const fail = q.get('integration_error');
    if (!ok && !fail) return;

    if (ok) {
      setBanner({ kind: 'success', text: 'Integration connected successfully.' });
    }
    if (fail) {
      setBanner({ kind: 'error', text: fail });
    }
    q.delete('integration_success');
    q.delete('integration_error');
    const next = q.toString();
    navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
    void load();
  }, [location.search, location.pathname, navigate, load]);

  const startOAuth = async (integration: JobIntegration) => {
    setBusyProvider(integration.provider);
    setError(null);
    try {
      const { authUrl } = await apiFetch<{ authUrl: string }>(
        `job/integrations/${encodeURIComponent(integration.provider)}/auth`,
        { method: 'POST', body: {} },
      );
      if (authUrl && typeof window !== 'undefined') {
        window.location.assign(authUrl);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start OAuth');
    } finally {
      setBusyProvider(null);
    }
  };

  const revoke = async (integration: JobIntegration) => {
    setBusyProvider(integration.provider);
    setError(null);
    try {
      await apiFetch(`job/integrations/${encodeURIComponent(integration.provider)}`, {
        method: 'DELETE',
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect');
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <JobToolBibleShell toolTitle="MOxE INTEGRATION" toolIconMaterial="sync_alt">
      <div className="flex flex-col gap-4">
        {banner ? (
          <div
            className={
              banner.kind === 'success'
                ? 'rounded-lg px-3 py-2 text-sm bg-[#E3FCEF] dark:bg-green-900/25 text-[#006644] dark:text-green-300'
                : JOB_MOBILE.error
            }
            role="status"
          >
            {banner.text}
            <button
              type="button"
              className="ml-2 underline text-xs opacity-90"
              onClick={() => setBanner(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        {error ? (
          <div className={JOB_MOBILE.error} role="alert">
            {error}
          </div>
        ) : null}
        <JobCard>
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
            Connect a provider with OAuth. You will be redirected to approve access, then returned here. Disconnect
            revokes stored tokens on the MOxE server. Each provider needs OAuth client credentials in the MOxE API
            environment — see BACKEND <code className="text-[11px]">.env.example</code> (INTEGRATION_* / SLACK_* /
            ATLASSIAN_*).
          </p>
        </JobCard>
        <JobCard variant="track" flush className="overflow-hidden">
          {loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">Loading integrations…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#5E6C84] dark:text-[#8C9BAB]">No integrations available.</div>
          )}
          <div className="divide-y divide-[#2C333A]">
            {items.map((i) => {
              const connected = i.status === 'CONNECTED';
              const isBusy = busyProvider === i.provider;
              return (
                <div
                  key={i.provider}
                  className={`flex flex-col gap-3 justify-between ${JOB_MOBILE.touchPadding}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
                        {i.displayName}
                      </span>
                      {connected && (
                        <span className="inline-flex items-center rounded-full bg-[#E3FCEF] dark:bg-green-900/30 text-[#006644] dark:text-green-300 px-2 py-0.5 text-[10px] font-medium">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">{i.description}</p>
                    {i.connectedAt && (
                      <p className="text-[11px] text-[#5E6C84] dark:text-[#8C9BAB] mt-0.5">
                        Last updated{' '}
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
                    onClick={() => (connected ? revoke(i) : startOAuth(i))}
                    className={
                      connected
                        ? `${JOB_MOBILE.btnSecondary} shrink-0 text-xs`
                        : `${JOB_MOBILE.btnPrimary} shrink-0 text-xs w-auto min-w-[100px]`
                    }
                  >
                    {isBusy ? 'Working…' : connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </JobCard>

        <JobDesignBiblePanel toolKey="integration" showHero={false} />
      </div>
    </JobToolBibleShell>
  );
}
