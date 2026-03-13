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
  const currentAccount = useSelector((state: RootState) => state.account.currentAccount);
  const accountType = (currentAccount as any)?.accountType;
  const role = (currentAccount as any)?.role;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredType && accountType !== requiredType)
    return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole)
    return <Navigate to="/" replace />;
  return <>{children}</>;
}
