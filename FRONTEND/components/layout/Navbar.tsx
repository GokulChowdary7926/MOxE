import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ShoppingBag,
  Bell,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';

export default function Navbar() {
  const cap = useAccountCapabilities();
  const account = useCurrentAccount();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const accountType = (account as any)?.accountType;
  const label = accountType ? ACCOUNT_TYPE_LABELS[accountType as keyof typeof ACCOUNT_TYPE_LABELS] : 'Account';

  const iconClass = 'w-5 h-5 text-white hover:text-violet-400 transition-colors';

  return (
    <nav className="bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center ring-2 ring-white/20">
          <span className="text-white font-bold text-lg leading-none font-serif italic">
            m
          </span>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">MOxE</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/create/post" className={iconClass} aria-label="Add">
          <Plus className="w-5 h-5" />
        </Link>
        <Link to="/commerce" className={iconClass} aria-label="Shop">
          <ShoppingBag className="w-5 h-5" />
        </Link>
        <Link to="/notifications" className={iconClass} aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </Link>
        <div className="relative">
          <button
            type="button"
            className={iconClass}
            aria-label="Menu"
            onClick={() => setSwitcherOpen(!switcherOpen)}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          {switcherOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20">
            <Link
              to="/settings"
              className="block px-4 py-2 text-sm text-white hover:bg-zinc-800"
              onClick={() => setSwitcherOpen(false)}
            >
              Settings
            </Link>
            <Link
              to="/settings/accounts"
              className="block px-4 py-2 text-sm text-white hover:bg-zinc-800"
              onClick={() => setSwitcherOpen(false)}
            >
              Switch account ({label})
            </Link>
            {cap.canTrack && (
              <Link
                to="/job/track"
                className="block px-4 py-2 text-sm text-violet-400 hover:bg-zinc-800"
                onClick={() => setSwitcherOpen(false)}
              >
                Job hub
              </Link>
            )}
          </div>
          </>
          )}
        </div>
        <Link to="/settings" className={iconClass} aria-label="Settings">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </nav>
  );
}
