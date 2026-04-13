import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';
import { fetchApiJson } from '../../services/api';

type DeletedItem = {
  id: string;
  __type: string;
  deletedAt: string;
  retentionDays?: number;
  caption?: string | null;
  content?: string | null;
};

export default function RecentlyDeletedPage() {
  const location = useLocation();
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const backTo = location.pathname.startsWith('/settings') ? '/settings' : '/activity';

  async function load() {
    setLoading(true);
    try {
      const data = await fetchApiJson<{ items?: DeletedItem[] }>('recently-deleted');
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const withDaysLeft = useMemo(
    () =>
      items.map((item) => {
        const retention = Number(item.retentionDays ?? 30);
        const deletedAt = new Date(item.deletedAt).getTime();
        const cutoff = deletedAt + retention * 24 * 60 * 60 * 1000;
        const left = Math.max(0, Math.ceil((cutoff - Date.now()) / (24 * 60 * 60 * 1000)));
        return { ...item, daysLeft: left };
      }),
    [items],
  );

  async function restoreItem(type: string, id: string) {
    await fetchApiJson(`recently-deleted/restore/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'POST',
    });
    await load();
  }

  async function permanentlyDeleteItem(type: string, id: string) {
    await fetchApiJson(
      `recently-deleted/permanent/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    await load();
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to={backTo} className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Recently Deleted</span>
          <div className="w-14" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-[#a8a8a8] text-sm px-4 py-3">
            Only you can see these items. They are automatically removed after their retention window.
          </p>
          {loading ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">Loading…</div>
          ) : withDaysLeft.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No recently deleted content.</div>
          ) : (
            <div className="px-4 space-y-3">
              {withDaysLeft.map((item) => (
                <div key={`${item.__type}-${item.id}`} className="rounded-xl border border-[#2a2a2a] bg-[#111214] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-semibold uppercase">{item.__type}</p>
                      <p className="text-[#9aa0a6] text-xs mt-1">{item.daysLeft} day(s) left</p>
                      <p className="text-[#c7cdd4] text-xs mt-1 line-clamp-2">
                        {(item.caption || item.content || '').toString().slice(0, 120) || 'Deleted item'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => restoreItem(item.__type, item.id)}
                        className="rounded-full bg-[#1d9bf0] px-3 py-1 text-white text-xs font-semibold"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => permanentlyDeleteItem(item.__type, item.id)}
                        className="rounded-full border border-[#5c2e2e] bg-[#2a1414] px-3 py-1 text-[#ffb4b4] text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
