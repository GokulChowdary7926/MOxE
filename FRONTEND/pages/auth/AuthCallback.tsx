import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { setCredentials } from '../../store/authSlice';
import { fetchMe } from '../../store/authSlice';
import { setCurrentAccount, setCapabilities } from '../../store/accountSlice';
import { getHomeRouteForAccountType } from '../../constants/accountTypes';

/** Handles OAuth callback: ?token=... from backend. Stores token, fetches me, redirects by account type (Personal / Business / Creator / Job). */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
    }
    dispatch(setCredentials({ token, user: { id: 'pending' } }));
    dispatch(fetchMe())
      .unwrap()
      .then((me) => {
        dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
        dispatch(setCapabilities(me.capabilities ?? null));
        const home = getHomeRouteForAccountType(me.account?.accountType);
        navigate(home, { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [params, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white text-sm">Signing you in…</p>
    </div>
  );
}
