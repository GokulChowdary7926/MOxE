import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Plus, MessageCircle, Heart, LayoutGrid, Store, Settings } from 'lucide-react';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { logoutThunk } from '../../store/authSlice';

/**
 * App header – same layout for all accounts:
 * Home: Plus (create), Message (DMs), Heart (notifications)
 * Explore: Store  |  Map / Messages: none  |  Profile: Grid, Settings
 */
export default function MobileHeader() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cap = useAccountCapabilities();
  const account = useCurrentAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountType = (account as any)?.accountType;
  const label = accountType ? ACCOUNT_TYPE_LABELS[accountType as keyof typeof ACCOUNT_TYPE_LABELS] : 'Account';

  const isHome = pathname === '/';
  const isExplore = pathname.startsWith('/explore');
  const isMap = pathname.startsWith('/map');
  const isMessages = pathname.startsWith('/messages');
  const isProfile = pathname.startsWith('/profile');

  const showPlusMessageHeart = isHome;
  const showStore = isExplore;
  const showNothing = isMap || isMessages;
  const showGridSettings = isProfile;

  // Home: light header with dark icons (reference design)
  const headerBg = isHome ? 'bg-white border-b border-[#dbdbdb]' : 'bg-black border-b border-[#262626]';
  const iconColor = isHome ? 'text-black' : 'text-white';
  const iconClass = `p-2 -m-2 ${iconColor} active:opacity-70`;
  const logoTextClass = isHome ? 'text-black' : 'text-white';

  return (
    <header className={`sticky top-0 z-20 ${headerBg} safe-area-pt`}>
      <div className="flex items-center justify-between h-12 px-3">
        {/* Left: logo + app name */}
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="MOxE Home">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#FCAF45] flex items-center justify-center shrink-0 overflow-visible">
            <span className="text-white font-bold text-lg leading-none font-serif italic">m</span>
            <svg
              className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
              viewBox="0 0 36 36"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              aria-hidden
            >
              <rect x="2" y="2" width="32" height="32" rx="4" />
              <path d="M2 2 L8 8 M34 2 L28 8 M2 34 L8 28 M34 34 L28 28" strokeWidth="1" />
            </svg>
          </div>
          <span className={`font-bold text-lg tracking-tight ${logoTextClass}`}>MOxE</span>
        </Link>

        {/* Right: same icons for Home on all accounts – Create (+), Messages, Heart (notifications) */}
        <div className="flex items-center gap-0">
          {showPlusMessageHeart && (
            <>
              <Link to="/create" className={iconClass} aria-label="Create">
                <Plus className="w-6 h-6" strokeWidth={2} />
              </Link>
              <Link to="/messages" className={iconClass} aria-label="Messages">
                <MessageCircle className="w-6 h-6" strokeWidth={2} />
              </Link>
              <Link to="/notifications" className={iconClass} aria-label="Notifications">
                <Heart className="w-6 h-6" strokeWidth={2} />
              </Link>
            </>
          )}
          {showStore && (
            <Link to="/commerce" className={iconClass} aria-label="Shop">
              <Store className="w-6 h-6" />
            </Link>
          )}
          {showGridSettings && (
            <>
              <div className="relative">
                <button
                  type="button"
                  className={iconClass}
                  aria-label="Menu"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <LayoutGrid className="w-6 h-6" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full mt-1 w-56 py-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20">
                      <Link
                        to="/settings/accounts"
                        className="block px-4 py-3 text-sm text-white hover:bg-zinc-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        Switch account ({label})
                      </Link>
                      {(accountType === 'BUSINESS' || accountType === 'CREATOR') && (
                        <Link
                          to="/commerce"
                          className="block px-4 py-3 text-sm text-white hover:bg-zinc-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          Shop
                        </Link>
                      )}
                      {accountType === 'JOB' && (
                        <Link
                          to="/job-hub"
                          className="block px-4 py-3 text-sm text-violet-400 hover:bg-zinc-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          Job hub
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-sm text-white hover:bg-zinc-800 border-t border-zinc-700 mt-1"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 border-t border-zinc-700 mt-1"
                        onClick={() => {
                          setMenuOpen(false);
                          dispatch(logoutThunk());
                          navigate('/login');
                        }}
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Link to="/settings" className={iconClass} aria-label="Settings">
                <Settings className="w-6 h-6" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
