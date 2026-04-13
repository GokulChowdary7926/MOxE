import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchApi, getToken } from '../services/api';

const BEAT_INTERVAL_MS = 60_000;
const BEAT_SECONDS = 60;

/** Sends periodic active time to the backend when the tab is visible (Your activity → Time spent). */
export function ScreenTimeBeat() {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = window.setInterval(() => {
      if (!getToken()) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void fetchApi('activity/screen-time/beat', {
        method: 'POST',
        body: JSON.stringify({ seconds: BEAT_SECONDS }),
      }).catch(() => {});
    }, BEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return null;
}
