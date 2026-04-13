import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Avatar } from '../../components/ui/Avatar';

export default function ProfilesAndPersonalDetails() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const username = account?.username ?? 'account';
  const profilePhoto = account?.profilePhoto;
  const contactInfo = account?.user?.phoneNumber ?? account?.contactPhone ?? 'Not added';
  const dobRaw = account?.user?.dateOfBirth as string | undefined;
  const dobDisplay = dobRaw
    ? new Date(dobRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not added';

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Profiles and personal details</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-[#a8a8a8] text-sm px-4 pt-4 pb-4">
            Review the profiles and personal details that you&apos;ve added to this Accounts Centre. Add more profiles by adding your accounts. <span className="text-[#0095f6]">Learn more</span>.
          </p>

          <p className="text-[#737373] text-xs font-semibold px-4 pt-2 pb-1">Profiles</p>
          <Link to="/settings/account-centre/profile-details" className="flex items-center gap-3 px-4 py-3 border-t border-b border-[#262626] text-white active:bg-white/5">
            <Avatar uri={profilePhoto} className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block font-medium">@{username}</span>
              <span className="text-xs text-[#737373]">MOxE</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
          <p className="px-4 py-2"><span className="text-[#0095f6] text-sm">Add accounts</span></p>

          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Personal details</p>
          <div className="border-t border-[#262626]">
            <Link to="/settings/account-centre/contact-information" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
              <span className="flex-1 font-medium">Contact info</span>
              <span className="text-[#a8a8a8] text-sm">{contactInfo}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
            <Link to="/settings/account-centre/date-of-birth" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
              <span className="flex-1 font-medium">Date of birth</span>
              <span className="text-[#a8a8a8] text-sm">{dobDisplay}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
