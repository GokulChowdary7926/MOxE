import React, { useState, useEffect } from 'react';
import { useCloudStorageGB } from '../../hooks/useCapabilities';
import { formatStorage } from '../../utils/subscriptionDisplay';
import { getApiBase, getToken } from '../../services/api';

export default function StorageIndicator() {
  const maxStorageGB = useCloudStorageGB();
  const [usedGB, setUsedGB] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${getApiBase()}/accounts/me/storage-usage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { usedGB: 0 }))
      .then((data: { usedGB?: number }) => {
        if (!cancelled) setUsedGB(data.usedGB ?? 0);
      })
      .catch(() => {
        if (!cancelled) setUsedGB(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const percentage = maxStorageGB > 0 ? Math.min(100, (usedGB / maxStorageGB) * 100) : 0;
  const isNearLimit = percentage > 80;

  if (isLoading) return null;

  return (
    <div className="p-4 bg-[var(--moxe-card)] border border-[var(--moxe-border)] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--moxe-text)]">Storage</span>
        <span className="text-sm text-[var(--moxe-text-secondary)]">
          {formatStorage(usedGB)} / {formatStorage(maxStorageGB)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-[#2C333A] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isNearLimit ? 'bg-yellow-500' : 'bg-[var(--moxe-primary)]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Storage nearly full.{' '}
          <a href="/settings/subscription" className="underline">
            Upgrade
          </a>{' '}
          for more space.
        </p>
      )}
    </div>
  );
}
