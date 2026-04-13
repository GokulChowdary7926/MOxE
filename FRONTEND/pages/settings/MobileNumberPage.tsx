import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Avatar } from '../../components/ui/Avatar';

export default function MobileNumberPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const username = account?.username ?? 'account';
  const profilePhoto = account?.profilePhoto;
  const contactInfo = account?.user?.phoneNumber ?? account?.contactPhone ?? 'Not added';

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Mobile number</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-white font-semibold text-2xl px-4 pt-6 pb-2">{contactInfo}</p>
          <p className="text-[#a8a8a8] text-sm px-4 pb-4">
            You added this number to these accounts. <span className="text-[#0095f6]">Who can see your number.</span>
          </p>

          <div className="border-t border-[#262626] px-4 py-3">
            <Link to="/settings/account-centre/profile-details" className="flex items-center gap-3 py-2 text-white active:opacity-80">
              <Avatar uri={profilePhoto} className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-medium">@{username}</span>
                <span className="text-xs text-[#737373]">MOxE</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          </div>

          <div className="px-4 pt-6">
            <button type="button" className="w-full py-3 rounded-lg border border-[#262626] text-red-500 font-semibold text-sm">
              Delete number
            </button>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
