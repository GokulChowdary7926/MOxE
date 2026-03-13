import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { UI } from '../../constants/uiTheme';
import { mockUsers } from '../../mocks/users';
import type { MockUser } from '../../mocks/users';

const INITIAL_CLOSE_FRIENDS_IDS = ['u1', 'u2', 'u4'];

export default function CloseFriendsList() {
  const [ids, setIds] = useState<string[]>(INITIAL_CLOSE_FRIENDS_IDS);
  const list = ids
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean) as MockUser[];

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/settings" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Close Friends</span>
        <div className="min-w-[80px] flex justify-end">
          <Link
            to="/close-friends/add"
            className={UI.headerAction}
            aria-label="Add to Close Friends"
          >
            <Plus className="w-5 h-5 inline-block" />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-20 px-4">
        <p className="text-[#a8a8a8] text-sm py-4">
          Only people on your Close Friends list can see when you post to close friends.
        </p>
        {list.length === 0 ? (
          <EmptyState
            title="No close friends yet"
            message="Add people to your list to share stories with just them."
          />
        ) : (
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden divide-y divide-[#363636]">
            {list.map((user) => (
              <div key={user.id} className={`${UI.listRow} flex items-center justify-between`}>
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80"
                >
                  <div className={UI.listAvatar}>
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">{user.displayName}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(user.id)}
                  className="py-2 px-4 rounded-lg border border-[#363636] text-sm font-semibold text-white hover:bg-white/5 active:opacity-80 flex-shrink-0"
                  aria-label={`Remove ${user.username} from Close Friends`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
