import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockUsers } from '../../mocks/users';
import type { MockUser } from '../../mocks/users';

const INITIAL_RESTRICTED_IDS = ['u4'];

export default function RestrictedList() {
  const [ids, setIds] = useState<string[]>(INITIAL_RESTRICTED_IDS);
  const list = ids
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean) as MockUser[];

  function unrestrict(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <PageLayout title="Restricted accounts" backTo="/settings/safety">
      <div className="py-4">
        {list.length === 0 ? (
          <EmptyState
            title="No restricted accounts"
            message="When you restrict someone, their comments and messages are limited. You can unrestrict them anytime."
          />
        ) : (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {list.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-3 px-4"
              >
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80"
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <ThemedText className="text-moxe-body font-semibold text-moxe-text truncate">
                      {user.username}
                    </ThemedText>
                    <ThemedText secondary className="text-moxe-caption truncate block">
                      {user.displayName}
                    </ThemedText>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => unrestrict(user.id)}
                  className="py-2 px-4 rounded-lg border border-moxe-border text-moxe-body font-semibold text-moxe-text hover:bg-moxe-surface/80 active:opacity-80 flex-shrink-0"
                  aria-label={`Unrestrict ${user.username}`}
                >
                  Unrestrict
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
