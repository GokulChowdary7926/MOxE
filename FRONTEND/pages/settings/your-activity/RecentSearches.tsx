import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Hash, MapPin, User, X } from 'lucide-react';
import { SettingsPageShell } from '../../../components/layout/SettingsPageShell';

type RecentSearchEntry = { id: string; type: 'user' | 'hashtag' | 'place'; term: string; subtitle?: string; refId?: string };

function IconForType({ type }: { type: RecentSearchEntry['type'] }) {
  switch (type) {
    case 'user': return <User className="w-5 h-5 text-[#a8a8a8]" />;
    case 'hashtag': return <Hash className="w-5 h-5 text-[#a8a8a8]" />;
    case 'place': return <MapPin className="w-5 h-5 text-[#a8a8a8]" />;
    default: return <Search className="w-5 h-5 text-[#a8a8a8]" />;
  }
}

export default function RecentSearches() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentSearchEntry[]>([]);

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  function handleSelect(entry: RecentSearchEntry) {
    if (entry.type === 'user' && entry.refId) {
      navigate(`/profile/${entry.term}`);
      return;
    }
    if (entry.type === 'hashtag') {
      navigate(`/hashtag/${entry.refId ?? entry.term}`);
      return;
    }
    if (entry.type === 'place' && entry.refId) {
      navigate(`/location/${entry.refId}`);
      return;
    }
  }

  return (
    <SettingsPageShell title="Recent searches" backTo="/activity">
      <div className="px-4 py-4">
            {items.length === 0 ? (
              <p className="text-[#a8a8a8] text-sm">No recent searches.</p>
            ) : (
              <>
                <div className="rounded-xl overflow-hidden border border-[#262626] divide-y divide-[#262626]">
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 py-3 px-4 bg-[#262626]/50">
                      <button type="button" className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-80" onClick={() => handleSelect(entry)}>
                        <IconForType type={entry.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{entry.type === 'hashtag' ? `#${entry.term}` : entry.term}</p>
                          {entry.subtitle && <p className="text-[#a8a8a8] text-xs truncate">{entry.subtitle}</p>}
                        </div>
                      </button>
                      <button type="button" onClick={() => remove(entry.id)} className="p-1 rounded-full text-[#a8a8a8] active:opacity-70" aria-label={`Remove ${entry.term}`}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={clearAll} className="mt-4 w-full py-3 text-[#0095f6] font-semibold text-sm active:opacity-80">
                  Clear all
                </button>
              </>
            )}
      </div>
    </SettingsPageShell>
  );
}
