import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shield, Key, Scan, LogIn, MapPin, Bell, Mail, CheckCircle } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function PasswordAndSecurityPage() {
  const navigate = useNavigate();

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Password and security</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Login & recovery</p>
          <p className="text-[#a8a8a8] text-xs px-4 pb-2">Manage your passwords, login preferences and recovery methods.</p>
          <div className="border-t border-[#262626]">
            <Row to="/settings/account-centre/change-password" icon={Key} label="Change password" />
            <Row to="/settings/account-centre/two-factor" icon={Shield} label="Two-factor authentication" />
            <Row to="/settings/account-centre/verification-selfie" icon={Scan} label="Verification selfie" />
            <Row to="/settings/account-centre/saved-login" icon={LogIn} label="Saved login" />
          </div>

          <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-1">Security checks</p>
          <p className="text-[#a8a8a8] text-xs px-4 pb-2">Review security issues by running checks across apps, devices and emails sent.</p>
          <div className="border-t border-[#262626]">
            <Row to="/settings/account-centre/where-logged-in" icon={MapPin} label="Where you're logged in" />
            <Row to="/settings/account-centre/login-alerts" icon={Bell} label="Login alerts" />
            <Row to="/settings/account-centre/recent-emails" icon={Mail} label="Recent emails" />
            <Row to="/settings/account-centre/security-checkup" icon={CheckCircle} label="Security Checkup" />
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
