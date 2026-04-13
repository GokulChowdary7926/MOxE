import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronRight, User, Shield, Link2, FileText, Megaphone, Wallet, RefreshCw } from 'lucide-react';
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

export default function AccountsCentre() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const username = account?.username ?? 'user';
  const profilePhoto = account?.profilePhoto;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <X className="w-6 h-6" />
          </button>
          <span className="flex-1 text-center text-[#737373] text-sm">∞ MOxE</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-white font-semibold text-xl text-center pt-6 pb-2">Accounts Centre</p>
          <p className="text-[#a8a8a8] text-sm px-4 pb-6 text-center">
            Manage your connected experiences and account settings across MOxE products and services. <span className="text-[#0095f6]">Learn more</span>
          </p>

          <Link to="/settings/account-centre/profiles-personal-details" className="flex items-center gap-3 px-4 py-3 border-t border-b border-[#262626] text-white active:bg-white/5">
            <Avatar uri={profilePhoto} className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block font-medium">Profiles and personal details</span>
              <span className="text-xs text-[#737373]">1 profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>

          <Row to="/settings/account" icon={User} label="Account type & profile" />
          <Row to="/settings/account-centre/password-security" icon={Shield} label="Password and security" />
          <Row to="/settings/account-centre/connected-experiences" icon={Link2} label="Connected experiences" />
          <Row to="/settings/account-centre/information-permissions" icon={FileText} label="Your information and permissions" />
          <Row to="/settings/account-centre/ad-preferences" icon={Megaphone} label="Ad preferences" />
          <Row to="/settings/orders-payments" icon={Wallet} label="Orders and payments" />
          <Row to="/settings/subscriptions" icon={RefreshCw} label="Subscriptions" />

          <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-1">Manage accounts</p>
          <Row to="/settings/accounts" icon={User} label="Manage accounts" />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
