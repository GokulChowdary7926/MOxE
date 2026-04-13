import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Eye, AtSign, FileText, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../../components/ui/Themed';
import { MobileShell } from '../../../components/layout/MobileShell';
import { UI } from '../../../constants/uiTheme';
import { fetchApi } from '../../../services/api';

type HistoryEntry = {
  id: string;
  type: 'privacy' | 'username' | 'bio';
  title: string;
  description: string;
  timeAgo: string;
};

export default function AccountHistory() {
  const [sort, setSort] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi('accounts/me/activity');
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const list = (data.items ?? data.activities ?? []) as any[];
        const mapped: HistoryEntry[] = list.slice(0, 50).map((x: any) => {
          const rawType = String(x.type || 'privacy').toLowerCase();
          const title = typeof x.title === 'string' && x.title.trim() ? x.title : rawType;
          let description =
            typeof x.description === 'string' && x.description.trim()
              ? x.description
              : 'Account update.';
          if (rawType.includes('username') && x.metadata?.newUsername) {
            description = `You changed your username to **${x.metadata.newUsername}**.`;
          }
          const created = x.createdAt ? new Date(x.createdAt) : new Date(0);
          const mins = Math.floor((Date.now() - created.getTime()) / 60000);
          let timeAgo = 'now';
          if (mins >= 60 * 24 * 7) timeAgo = `${Math.floor(mins / (60 * 24 * 7))}w`;
          else if (mins >= 60 * 24) timeAgo = `${Math.floor(mins / (60 * 24))}d`;
          else if (mins >= 60) timeAgo = `${Math.floor(mins / 60)}h`;
          else if (mins >= 1) timeAgo = `${mins}m`;
          const entryType: HistoryEntry['type'] = rawType.includes('username')
            ? 'username'
            : rawType.includes('bio')
              ? 'bio'
              : 'privacy';
          return { id: x.id || String(Math.random()), type: entryType, title, description, timeAgo };
        });
        setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function Icon({ type }: { type: HistoryEntry['type'] }) {
    if (type === 'username') return <AtSign className="w-5 h-5 text-[#a8a8a8]" />;
    if (type === 'bio') return <FileText className="w-5 h-5 text-[#a8a8a8]" />;
    return <Eye className="w-5 h-5 text-[#a8a8a8]" />;
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Account History</span>
          <div className="w-20" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto border-b border-[#262626]">
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              Newest to oldest <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              All dates <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              Update type <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="px-4 py-4">
            <h2 className="text-white font-semibold mb-1">About account history</h2>
            <p className="text-[#a8a8a8] text-sm">Review changes that you&apos;ve made to your account since you created it.</p>
          </div>

          {loading ? (
            <p className="text-[#737373] text-sm px-4 py-8">Loading…</p>
          ) : (
            <>
              <h3 className="text-white font-medium px-4 py-2">This year</h3>
              <ul className="divide-y divide-[#262626]">
                {items.length === 0 ? (
                  <li className="px-4 py-8 text-[#737373] text-sm">No account history yet.</li>
                ) : (
                  items.map((entry) => (
                    <li key={entry.id}>
      <Link to="/settings/info/account-history-detail" className="flex items-center gap-3 px-4 py-3 active:bg-white/5">
                        <Icon type={entry.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{entry.title}</p>
                          <p className="text-[#a8a8a8] text-sm">{entry.description.replace(/\*\*/g, '')}</p>
                        </div>
                        <span className="text-[#737373] text-xs flex-shrink-0">{entry.timeAgo}</span>
                        <ChevronRight className="w-4 h-4 text-[#737373]" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
