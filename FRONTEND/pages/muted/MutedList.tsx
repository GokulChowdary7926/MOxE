import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { mockUsers } from '../../mocks/users';
import type { MockUser } from '../../mocks/users';

const INITIAL_MUTED_IDS = ['u5'];

export default function MutedList() {
  const [ids, setIds] = useState<string[]>(INITIAL_MUTED_IDS);
  const list = ids
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean) as MockUser[];

  function unmute(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <SettingsPageShell title="Muted accounts" backTo="/settings">
      <div className="px-4 py-4">
        {list.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">
            When you mute someone, you won&apos;t see their posts or stories in your feed. You can unmute them anytime.
          </p>
        ) : (
          <ul className="divide-y divide-[#262626]">
            {list.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80">
                  <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{user.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">{user.displayName}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => unmute(user.id)}
                  className="py-2 px-4 rounded-lg border border-[#363636] text-white font-semibold text-sm active:bg-white/10 flex-shrink-0"
                  aria-label={`Unmute ${user.username}`}
                >
                  Unmute
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
