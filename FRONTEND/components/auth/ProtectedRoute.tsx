import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface Props {
  children: React.ReactNode;
  /** Require this account type (e.g. "JOB" for Job hub). */
  requiredType?: string;
  /** Require this role (e.g. "ADMIN"). */
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredType, requiredRole }: Props) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const token = useSelector((state: RootState) => state.auth.token);
  const currentAccount = useSelector((state: RootState) => state.account.currentAccount);
  const accountType = (currentAccount as any)?.accountType;
  const role = (currentAccount as any)?.role;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  /** After refresh, `fetchMe` hydrates `currentAccount`; avoid false redirect while `accountType` is still undefined. */
  const sessionHydrating = Boolean(token) && currentAccount == null && (requiredType || requiredRole);
  if (sessionHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-moxe-textSecondary text-sm px-6 text-center">
        Loading your account…
      </div>
    );
  }

  if (requiredType && accountType !== requiredType) return <Navigate to="/" replace />;
  if (requiredRole) {
    const isPlatformAdmin = Boolean((currentAccount as { isPlatformAdmin?: boolean } | null)?.isPlatformAdmin);
    if (requiredRole === 'ADMIN') {
      if (role !== requiredRole && !isPlatformAdmin) return <Navigate to="/" replace />;
    } else if (role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }
  return <>{children}</>;
}
