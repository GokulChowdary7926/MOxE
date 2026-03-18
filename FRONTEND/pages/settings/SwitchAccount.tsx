import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentAccount, setAccounts, setCapabilities } from '../../store/accountSlice';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import type { RootState } from '../../store';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase } from '../../services/api';

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
    fetch(`${getApiBase()}/accounts/list`, {
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
      <ThemedView className="min-h-screen flex items-center justify-center bg-black/80">
        <MobileShell>
          <div className="flex-1 flex items-center justify-center">
            <ThemedText secondary>Loading accounts…</ThemedText>
          </div>
        </MobileShell>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center">
      <MobileShell>
        <div className="mt-auto w-full rounded-t-3xl bg-[#101010] border-t border-white/10 pb-6 pt-3 px-4">
          <div className="flex items-center justify-between mb-3">
            <ThemedText className="text-white font-semibold text-sm">Accounts</ThemedText>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-[#0095f6] text-xs font-semibold"
            >
              Done
            </button>
          </div>

          <div className="space-y-2">
            {list.map((acc: any) => {
              const isCurrent = acc.id === currentId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSwitch(acc)}
                  className="w-full flex items-center gap-3 py-2 active:opacity-80"
                >
                  <Avatar uri={acc.profilePhoto ?? acc.avatarUri} size={40} />
                  <div className="flex-1 min-w-0 text-left">
                    <ThemedText className="text-white text-sm font-semibold truncate">
                      {acc.username}
                    </ThemedText>
                    <ThemedText secondary className="text-[#a8a8a8] text-xs truncate">
                      {ACCOUNT_TYPE_LABELS[acc.accountType as keyof typeof ACCOUNT_TYPE_LABELS]}
                    </ThemedText>
                  </div>
                  {isCurrent && (
                    <span className="w-4 h-4 rounded-full border border-[#0095f6] flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full text-left text-[#0095f6] text-sm font-semibold"
            >
              Add MOxE Account
            </button>
            <button
              type="button"
              className="w-full text-center text-[#737373] text-[11px]"
            >
              Go to Accounts Centre
            </button>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
