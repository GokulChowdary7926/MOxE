import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentAccount, setAccounts, setCapabilities } from '../../store/accountSlice';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import type { RootState } from '../../store';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function SwitchAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentAccount = useSelector((state: RootState) => state.account.currentAccount);
  const accounts = useSelector((state: RootState) => state.account.accounts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/accounts/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => dispatch(setAccounts(list)))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const currentId = (currentAccount as any)?.id;
  const list = Array.isArray(accounts) && accounts.length > 0 ? accounts : (currentAccount ? [currentAccount] : []);

  const handleSwitch = (account: any) => {
    dispatch(setCurrentAccount({ ...account, capabilities: account.capabilities }));
    dispatch(setCapabilities(account.capabilities ?? null));
    navigate('/');
  };

  if (loading) {
    return (
      <PageLayout title="Accounts" backTo="/settings">
        <div className="py-8 flex justify-center">
          <ThemedText secondary>Loading accounts…</ThemedText>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Accounts" backTo="/settings">
      <div className="py-4 space-y-1">
        <ThemedText secondary className="block mb-4 text-moxe-body">
          Switch or add an account. Tabs and features depend on account type.
        </ThemedText>
        {list.map((acc: any) => {
          const isCurrent = acc.id === currentId;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleSwitch(acc)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                isCurrent
                  ? 'border-moxe-primary bg-moxe-primary/10'
                  : 'border-moxe-border bg-moxe-surface active:bg-moxe-border'
              }`}
            >
              <Avatar uri={acc.profilePhoto ?? acc.avatarUri} size={48} />
              <div className="flex-1 min-w-0">
                <ThemedText className="font-semibold text-moxe-body block truncate">
                  {acc.displayName || acc.username}
                </ThemedText>
                <ThemedText secondary className="text-moxe-caption">
                  @{acc.username} · {ACCOUNT_TYPE_LABELS[acc.accountType as keyof typeof ACCOUNT_TYPE_LABELS]}
                </ThemedText>
              </div>
              {isCurrent && (
                <span className="text-moxe-primary text-moxe-caption font-medium">Active</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <Link
          to="/register"
          className="block w-full py-3 px-4 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-text text-moxe-body font-medium text-center active:opacity-80"
        >
          Add account
        </Link>
      </div>
    </PageLayout>
  );
}
