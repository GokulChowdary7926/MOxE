import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Image, Smile } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Avatar } from '../../components/ui/Avatar';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function ProfileDetailsPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const displayName = account?.displayName ?? account?.username ?? 'User';
  const username = account?.username ?? 'user';
  const profilePhoto = account?.profilePhoto;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Profile details</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="flex flex-col items-center py-6">
            <Avatar uri={profilePhoto} className="w-20 h-20 mb-2" />
            <span className="text-white font-semibold text-lg">{displayName}</span>
            <span className="text-[#a8a8a8] text-sm">@{username} · MOxE</span>
          </div>

          <div className="border-t border-[#262626]">
            <Row to="/settings/account-centre/name" icon={User} label="Name" />
            <Row to="/settings/account-centre/username" icon={User} label="Username" />
            <Row to="/profile/edit" icon={Image} label="Profile picture" />
            <Row to="/profile/edit" icon={Smile} label="Avatar" />
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
