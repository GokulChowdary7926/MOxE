import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, clearStoredAuth } from '../config/api';

export type AccountType = 'personal' | 'business' | 'creator' | 'job';

interface AccountContextValue {
  accountType: AccountType;
  setAccountType: (t: AccountType) => void;
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStoredToken().then((token) => {
      setLoggedIn(!!token);
      setHydrated(true);
    });
  }, []);

  const logout = useCallback(async () => {
    await clearStoredAuth();
    setLoggedIn(false);
  }, []);

  const value = useMemo(
    () => ({
      accountType,
      setAccountType,
      isLoggedIn: hydrated ? isLoggedIn : false,
      setLoggedIn,
      logout,
    }),
    [accountType, isLoggedIn, hydrated, logout]
  );
  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
