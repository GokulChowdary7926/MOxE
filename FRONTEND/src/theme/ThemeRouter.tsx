import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function isJobPath(pathname: string): boolean {
  return pathname === '/job' || pathname.startsWith('/job/');
}

export function ThemeRouter() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const design = isJobPath(pathname) ? 'atlassian' : 'instagram';
    root.setAttribute('data-design', design);
  }, [pathname]);

  return null;
}

