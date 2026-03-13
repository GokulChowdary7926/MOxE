import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, MessageCircle, Briefcase, User } from 'lucide-react';
import { useAccountType } from '../../hooks/useAccountCapabilities';

/**
 * Same layout for all accounts:
 * - Personal / Creator / Business: Home, Explore, Map, Message, Profile
 * - Job (social mode): Home, Projects, Map, Message, Profile
 * Light theme: off-white bar with white capsule for active tab.
 */
export default function BottomNav() {
  const path = useLocation().pathname;
  const accountType = (useAccountType() || 'PERSONAL').toUpperCase();
  const isJob = accountType === 'JOB';

  const isActive = (to: string) => {
    if (to === '/') return path === '/';
    return path.startsWith(to);
  };

  const tabs = [
    // 1) Home – same for all account types
    { to: '/', label: 'Home', Icon: Home },
    // 2) Explore / Projects – Explore for Personal/Creator/Business, Projects for Job
    {
      to: isJob ? '/job/work' : '/explore',
      label: isJob ? 'Projects' : 'Explore',
      Icon: isJob ? Briefcase : Search,
    },
    // 3) Map – unified MOxE Map with Nearby Places, Nearby Messaging, SOS, Proximity Alerts
    { to: '/map', label: 'Map', Icon: MapPin },
    // 4) Messages
    { to: '/messages', label: 'Message', Icon: MessageCircle },
    // 5) Profile
    { to: '/profile', label: 'Profile', Icon: User },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white/95 border-t border-[#dbdbdb] flex items-stretch z-30 safe-area-pb h-14 backdrop-blur-sm">
      {tabs.map(({ to, label, Icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 flex-1 ${
              active ? 'text-[#262626]' : 'text-[#8e8e8e]'
            }`}
          >
            <span className={`flex items-center justify-center w-10 h-8 rounded-lg ${active ? 'bg-[#f0f0f0]' : ''}`}>
              <Icon className={`w-6 h-6 flex-shrink-0 ${active && (to === '/' || to === '/create') ? 'stroke-[2.5]' : ''}`} fill={active && to === '/' ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
