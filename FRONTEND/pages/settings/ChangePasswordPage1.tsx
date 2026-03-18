import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Avatar } from '../../components/ui/Avatar';

export default function ChangePasswordPage1() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const username = account?.username ?? 'user';
  const profilePhoto = account?.profilePhoto;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Change password</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto p-4">
          <p className="text-[#a8a8a8] text-sm mb-6">Choose an account to make changes.</p>
          <Link
            to="/settings/account-centre/change-password/form"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white active:bg-white/10"
          >
            <Avatar uri={profilePhoto} className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block font-medium">@{username}</span>
              <span className="text-xs text-[#737373]">MOxE</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
