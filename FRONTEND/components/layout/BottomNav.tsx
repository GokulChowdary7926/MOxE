import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, MessageCircle, User, Wrench } from 'lucide-react';
import { useAccountType } from '../../hooks/useAccountCapabilities';

type TabDef = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; fill?: string; strokeWidth?: number }>;
  /** Custom active check (pathname from useLocation) */
  isActive: (path: string) => boolean;
};

/**
 * Account-type bottom tabs (5 tabs each):
 * - Personal / Creator / Business: Home, Explore, Map, Message, Profile
 * - Job (social mode): Home, Tools (job hub), Map, Explore, Profile — DMs stay in the top bar on Home
 */
export default function BottomNav() {
  const path = useLocation().pathname;
  const accountType = (useAccountType() || 'PERSONAL').toUpperCase();
  const isJob = accountType === 'JOB';

  const defaultTabs: TabDef[] = [
    { to: '/', label: 'Home', Icon: Home, isActive: (p) => p === '/' },
    {
      to: '/explore',
      label: 'Explore',
      Icon: Search,
      isActive: (p) => p.startsWith('/explore'),
    },
    { to: '/map', label: 'Map', Icon: MapPin, isActive: (p) => p.startsWith('/map') },
    {
      to: '/messages',
      label: 'Message',
      Icon: MessageCircle,
      isActive: (p) => p.startsWith('/messages'),
    },
    { to: '/profile', label: 'Profile', Icon: User, isActive: (p) => p.startsWith('/profile') },
  ];

  const jobSocialTabs: TabDef[] = [
    { to: '/', label: 'Home', Icon: Home, isActive: (p) => p === '/' },
    {
      to: '/job',
      label: 'Tools',
      Icon: Wrench,
      isActive: (p) => p.startsWith('/job'),
    },
    { to: '/map', label: 'Map', Icon: MapPin, isActive: (p) => p.startsWith('/map') },
    {
      to: '/explore',
      label: 'Explore',
      Icon: Search,
      isActive: (p) => p.startsWith('/explore'),
    },
    { to: '/profile', label: 'Profile', Icon: User, isActive: (p) => p.startsWith('/profile') },
  ];

  const tabs = isJob ? jobSocialTabs : defaultTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-black border-t border-moxe-border flex items-stretch z-30 safe-area-pb h-14 backdrop-blur-sm">
      {tabs.map(({ to, label, Icon, isActive }) => {
        const active = isActive(path);
        return (
          <Link
            key={`${to}-${label}`}
            to={to}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 flex-1 ${
              active ? 'text-moxe-primary' : 'text-moxe-textSecondary'
            }`}
          >
            <span className={`flex items-center justify-center w-10 h-8 rounded-lg ${active ? 'bg-white/10' : ''}`}>
              <Icon className={`w-6 h-6 flex-shrink-0 ${active ? 'stroke-[2.5]' : ''}`} fill={active && to === '/' ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
