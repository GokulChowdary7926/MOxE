import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageCircle, Heart, Search, Camera, User, Settings, Shield, BarChart3, Film } from 'lucide-react';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

/**
 * Instagram-style Mobile Header (used globally on routes without their own header).
 *
 * Spec (mobile):
 * - Left: Logo (Home)
 * - Right icons: Search, optional account shortcut, Camera, Create, Messages, Notifications, Profile
 */
export default function MobileHeader() {
  const { pathname } = useLocation();
  const account = useCurrentAccount() as any;
  const [profilePhotoError, setProfilePhotoError] = useState(false);

  const isHome = pathname === '/';
  const headerBg = isHome ? 'bg-white border-b border-[#dbdbdb]' : 'bg-black border-b border-[#262626]';
  const iconColor = isHome ? 'text-black' : 'text-white';
  const iconClass = `p-2 -m-2 ${iconColor} active:opacity-70`;
  const logoTextClass = isHome ? 'text-black' : 'text-white';

  const accountType = account?.accountType as string | undefined;
  const extraIcon = (() => {
    if (accountType === 'BUSINESS') return { Icon: BarChart3, to: '/insights', label: 'Insights' };
    if (accountType === 'CREATOR') return { Icon: Film, to: '/creator-studio', label: 'Creator Studio' };
    if (accountType === 'JOB') return { Icon: Shield, to: '/map/sos', label: 'SOS' };
    return null;
  })();

  useEffect(() => {
    // Reset error fallback whenever account profile photo changes.
    setProfilePhotoError(false);
  }, [account?.profilePhoto]);

  return (
    <header className={`sticky top-0 z-20 ${headerBg} safe-area-pt`}>
      <div className="flex items-center justify-between h-12 px-3">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="MOxE Home">
          <img src="/logo.png" alt="MOxE" className="w-9 h-9 rounded-lg shrink-0 object-cover" />
          <span className={`font-bold text-lg tracking-tight hidden sm:inline ${logoTextClass}`}>MOxE</span>
        </Link>

        <div className="flex items-center gap-0">
          <Link to="/explore" className={iconClass} aria-label="Search">
            <Search className="w-6 h-6" strokeWidth={2} />
          </Link>

          {extraIcon && (
            <Link to={extraIcon.to} className={iconClass} aria-label={extraIcon.label}>
              <extraIcon.Icon className="w-6 h-6" strokeWidth={2} />
            </Link>
          )}

          <Link to="/stories/create/camera" className={iconClass} aria-label="Camera">
            <Camera className="w-6 h-6" strokeWidth={2} />
          </Link>

          <Link to="/create" className={iconClass} aria-label="Create">
            <Plus className="w-6 h-6" strokeWidth={2} />
          </Link>

          <Link to="/messages" className={iconClass} aria-label="Messages">
            <MessageCircle className="w-6 h-6" strokeWidth={2} />
          </Link>

          <Link to="/notifications" className={iconClass} aria-label="Notifications">
            <Heart className="w-6 h-6" strokeWidth={2} />
          </Link>

          <Link to="/profile" className={iconClass} aria-label="Profile">
            {account?.profilePhoto && !profilePhotoError ? (
              <img
                src={account.profilePhoto}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover"
                onError={() => setProfilePhotoError(true)}
              />
            ) : (
              <User className="w-6 h-6" strokeWidth={2} />
            )}
          </Link>

          <Link to="/settings" className={iconClass} aria-label="Settings">
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
