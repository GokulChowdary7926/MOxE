import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, MapPin, User, X } from 'lucide-react';
import { PageLayout } from '../../../components/layout/PageLayout';
import { ThemedText } from '../../../components/ui/Themed';
import { mockRecentSearches } from '../../../mocks/searches';
import type { RecentSearchEntry } from '../../../mocks/searches';

function IconForType({ type }: { type: RecentSearchEntry['type'] }) {
  switch (type) {
    case 'user':
      return <User className="w-5 h-5 text-moxe-textSecondary" />;
    case 'hashtag':
      return <Hash className="w-5 h-5 text-moxe-textSecondary" />;
    case 'place':
      return <MapPin className="w-5 h-5 text-moxe-textSecondary" />;
    default:
      return <Search className="w-5 h-5 text-moxe-textSecondary" />;
  }
}

export default function RecentSearches() {
  const navigate = useNavigate();
  const [items, setItems] = useState(mockRecentSearches);

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
    <PageLayout title="Recent searches" backTo="/activity">
      <div className="py-4">
        {items.length === 0 ? (
          <ThemedText secondary className="text-moxe-body block">
            No recent searches.
          </ThemedText>
        ) : (
          <>
            <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
              {items.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-3 px-4"
                >
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-80"
                    onClick={() => handleSelect(entry)}
                  >
                    <IconForType type={entry.type} />
                    <div className="flex-1 min-w-0">
                      <ThemedText className="text-moxe-body font-medium text-moxe-text truncate">
                        {entry.type === 'hashtag' ? `#${entry.term}` : entry.term}
                      </ThemedText>
                      {entry.subtitle && (
                        <ThemedText secondary className="text-moxe-caption">
                          {entry.subtitle}
                        </ThemedText>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="p-1 rounded-full text-moxe-textSecondary hover:bg-moxe-surface/80 active:opacity-70"
                    aria-label={`Remove ${entry.term} from recent searches`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 w-full py-3 text-moxe-primary text-moxe-body font-semibold active:opacity-80"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </PageLayout>
  );
}
