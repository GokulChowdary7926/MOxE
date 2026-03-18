import React, { useState } from 'react';
import { getApiBase, getToken } from '../../services/api';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

/**
 * GDPR/CCPA data portability: request and download a copy of the user's data.
 * Calls POST /api/accounts/me/data-export and triggers file download.
 */
export default function DownloadYourDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to download your data.');
        return;
      }
      const res = await fetch(`${getApiBase()}/accounts/me/data-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moxe-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to download your data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsPageShell title="Download your data" backTo="/settings">
      <div className="px-4 py-6 space-y-4">
        <p className="text-[#a8a8a8] text-sm">
          Download a copy of your MOxE data (profile, posts metadata, follows, likes, saved posts, collections, comments, messages metadata, notifications metadata) in JSON format. This supports your right to data portability (e.g. GDPR, CCPA).
        </p>
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleRequestDownload}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Preparing download…' : 'Download my data'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
