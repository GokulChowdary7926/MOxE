import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { AUTH } from './authStyles';

/** MOxE splash: logo, loading, then redirect to login or home */
export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-black safe-area-pt safe-area-pb ${AUTH.bg}`}>
      <div className={AUTH.logoWrapper}>
        <img src="/logo.png" alt="MOxE" className="w-20 h-20 rounded-xl object-cover" />
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        <p className="text-[#737373] text-xs">Loading…</p>
      </div>
      <p className="absolute bottom-8 left-0 right-0 text-center text-[#737373] text-[10px]">v1.0</p>
    </div>
  );
}
