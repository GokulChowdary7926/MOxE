import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Check } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { UI } from '../../constants/uiTheme';
import { mockUsers } from '../../mocks/users';
import type { MockUser } from '../../mocks/users';

export default function CloseFriendsAdd() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = query.trim()
    ? mockUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.displayName.toLowerCase().includes(query.toLowerCase())
      )
    : mockUsers;

  function toggle(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleDone() {
    // In a real app: persist selectedIds to API, then navigate
    navigate('/close-friends');
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/close-friends" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Add to Close Friends</span>
        <div className="min-w-[80px]" />
      </header>

      <div className="flex-1 overflow-auto pb-24">
        <div className="px-4 py-3 rounded-none bg-[#262626] border-y border-[#363636]">
          <p className="text-[#a8a8a8] text-sm">
            Only people on your list can see when you post to close friends.{' '}
            <button type="button" className="text-[#0095f6] font-medium">
              How it works
            </button>
          </p>
        </div>

        <div className="relative px-4 py-3">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
            aria-label="Search users"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[#a8a8a8] text-sm">{filtered.length} people</span>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[#0095f6] text-sm font-semibold"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden divide-y divide-[#363636] mx-4">
          {filtered.map((user) => {
            const isSelected = selectedIds.has(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user.id)}
                className={`${UI.listRow} w-full flex items-center gap-3 text-left`}
              >
                <div className={UI.listAvatar}>
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                  <p className="text-[#a8a8a8] text-sm truncate">{user.displayName}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#0095f6] border-[#0095f6]' : 'border-[#363636]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-black border-t border-[#262626] safe-area-pb">
          <button
            type="button"
            onClick={handleDone}
            className={UI.btnPrimary}
          >
            Done
          </button>
        </div>
      </div>
    </ThemedView>
  );
}
