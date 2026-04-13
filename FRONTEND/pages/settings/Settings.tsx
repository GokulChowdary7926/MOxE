import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Search, ChevronRight, ChevronLeft, User, Bookmark, Archive, BarChart3, Bell, Clock, Lock, Star, LayoutGrid, Ban, MessageCircle, AtSign, MessageSquare, Share2, CircleSlash, AlertCircle, Heart, Smartphone, Download, Accessibility, Languages, BarChart2, Monitor, Users, HelpCircle, Shield, Info, MapPin, Palette } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';

function Row({ to, icon: Icon, label, value, subtitle }: { to: string; icon: React.ElementType; label: string; value?: string; subtitle?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      {Icon && <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {subtitle && <span className="text-xs text-[#737373] block">{subtitle}</span>}
      </div>
      {(value != null) && <span className="text-[#a8a8a8] text-sm">{value}</span>}
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">{children}</p>;
}

const THEME_DISPLAY = 'Dark';

export default function Settings() {
  const navigate = useNavigate();
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as {
    accountType?: string;
    verifiedBadge?: boolean;
  } | null;
  const isVerified = !!currentAccount?.verifiedBadge;
  const isPersonalAccount = currentAccount?.accountType === 'PERSONAL';
  const [isPrivate, setIsPrivate] = useState(false);
  const [closeFriendsCount, setCloseFriendsCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [restrictedCount, setRestrictedCount] = useState<number | null>(null);
  const [mutedCount, setMutedCount] = useState<number | null>(null);
  const [snoozedCount, setSnoozedCount] = useState<number | null>(null);
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [limitInteractionsOn, setLimitInteractionsOn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account?.isPrivate != null) setIsPrivate(data.account.isPrivate);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/close-friends`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.list ?? data?.closeFriends ?? [];
        setCloseFriendsCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/privacy/blocked`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.blocked ?? [];
        setBlockedCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/privacy/restricted`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.restricted ?? [];
        setRestrictedCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/privacy/muted`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.muted ?? [];
        setMutedCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/follow/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.favorites ?? [];
        setFavoritesCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
    fetch(`${getApiBase()}/privacy/limit-interactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { active?: boolean } | null) => {
        setLimitInteractionsOn(typeof data?.active === 'boolean' ? data.active : false);
      })
      .catch(() => {});
  }, []);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Settings and activity</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="relative px-4 py-3">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>

          <SectionTitle>Your account</SectionTitle>
          <Link to="/settings/account-centre" className="flex items-center gap-3 px-4 py-3 border-y border-[#262626] text-white active:bg-white/5">
            <User className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block font-medium">Accounts Centre</span>
              <span className="text-xs text-[#737373] block">Password, security, personal details, ad preferences</span>
            </div>
            <span className="text-[#737373] text-xs">∞ MOxE</span>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
          <p className="text-[#737373] text-xs px-4 py-2">
            Manage your connected experiences and account settings across MOxE technologies. <span className="text-[#0095f6]">Learn more</span>
          </p>

          <SectionTitle>How you use MOxE</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/saved" icon={Bookmark} label="Saved" />
            <Row to="/archive" icon={Archive} label="Archive" />
            <Row to="/activity" icon={BarChart3} label="Your activity" />
            <Row to="/settings/notifications" icon={Bell} label="Notifications" />
            <Row to="/settings/your-activity/time-management" icon={Clock} label="Time management" />
          </div>

          <SectionTitle>Who can see your content</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/privacy" icon={Lock} label="Privacy" subtitle="Search visibility, activity status, remove followers, story" />
            {isPersonalAccount && <Row to="/settings/account-privacy" icon={Lock} label="Account privacy" value={isPrivate ? 'Private' : 'Public'} />}
            <Row to="/close-friends" icon={Star} label="Close Friends" value={String(closeFriendsCount)} />
            <Row to="/settings/crossposting" icon={LayoutGrid} label="Crossposting" />
            <Row to="/settings/map" icon={MapPin} label="Map" />
          </div>

          <SectionTitle>How others can interact with you</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/blocked" icon={Ban} label="Blocked" value={blockedCount != null ? String(blockedCount) : undefined} />
            <Row to="/settings/blocked-messaging" icon={MessageSquare} label="Blocked messaging" subtitle="Messages from blocked accounts" />
            <Row to="/settings/story-live-location" icon={MessageCircle} label="Story, live and location" />
            <Row to="/settings/activity-friends-tab" icon={Users} label="Activity in Friends tab" />
            <Row to="/settings/messages" icon={MessageSquare} label="Messages and story replies" />
            <Row to="/settings/tags-mentions" icon={AtSign} label="Tags and mentions" />
            <Row to="/settings/comments" icon={MessageSquare} label="Comments" />
            <Row to="/settings/sharing" icon={Share2} label="Sharing" />
            <Row to="/restricted" icon={CircleSlash} label="Restricted accounts" value={restrictedCount != null ? String(restrictedCount) : undefined} />
            <Row
              to="/settings/limit-interactions"
              icon={AlertCircle}
              label="Limit interactions"
              value={limitInteractionsOn == null ? undefined : limitInteractionsOn ? 'On' : 'Off'}
            />
            <Row to="/settings/hidden-words" icon={AtSign} label="Hidden words" />
            <Row to="/settings/following-invitations" icon={User} label="Following and invitations" />
          </div>

          <SectionTitle>What you see</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row
              to="/favorites"
              icon={Heart}
              label="Favourites"
              value={favoritesCount != null ? String(favoritesCount) : undefined}
            />
            <Row to="/muted" icon={Bell} label="Muted accounts" value={mutedCount != null ? String(mutedCount) : undefined} />
            <Row
              to="/snoozed"
              icon={Clock}
              label="Snoozed accounts"
              value={snoozedCount != null ? String(snoozedCount) : undefined}
              subtitle="Hidden from home feed for a time"
            />
            <Row to="/settings/content-preferences" icon={LayoutGrid} label="Content preferences" />
            <Row to="/settings/algorithm-preferences" icon={BarChart3} label="Your algorithm" subtitle="Tell MOxE what to show more or less" />
            <Row to="/settings/like-share-counts" icon={Heart} label="Like and share counts" />
            <Row to="/settings/subscriptions" icon={Star} label="Subscriptions" />
          </div>

          <SectionTitle>Appearance</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/theme" icon={Palette} label="Theme" value={THEME_DISPLAY} subtitle="Dark only" />
          </div>

          <SectionTitle>Your app and media</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/device-permissions" icon={Smartphone} label="Device permissions" />
            <Row
              to="/settings/data-usage"
              icon={Smartphone}
              label="Data usage and media"
              subtitle="Data saver, preload reels, storage estimate"
            />
            <Row to="/settings/archiving-downloading" icon={Download} label="Archiving and downloading" />
            <Row to="/settings/accessibility" icon={Accessibility} label="Accessibility" />
            <Row to="/settings/language" icon={Languages} label="Language and translations" />
            <Row to="/settings/media-quality" icon={BarChart2} label="Media quality" />
            <Row to="/settings/app-website-permissions" icon={Monitor} label="App website permissions" />
          </div>

          <SectionTitle>Family Centre</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/teen-account" icon={Users} label="Supervision for Teen Accounts" />
          </div>

          <SectionTitle>For professionals</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/account-type-tools" icon={BarChart2} label="Account type and tools" />
            <Row to="/settings/subscriptions" icon={Shield} label="MOxE Verified" value="Not subscribed" />
            {isVerified && (
              <>
                <Row to="/settings/verified-support" icon={HelpCircle} label="Verified support" subtitle="Help resources for verified accounts" />
                <Row to="/settings/verified-protection" icon={Shield} label="Verified protection" subtitle="Extra account safeguards (preferences)" />
              </>
            )}
          </div>

          <SectionTitle>Data and privacy</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/download-your-data" icon={Download} label="Download your data" subtitle="Export your data (GDPR/CCPA)" />
            <Row to="/settings/recently-deleted" icon={Archive} label="Recently Deleted" subtitle="Restore or permanently delete content" />
          </div>

          <SectionTitle>More info and support</SectionTitle>
          <div className="border-t border-[#262626]">
            <Row to="/settings/help" icon={HelpCircle} label="Help" />
            <Row to="/settings/privacy-centre" icon={Info} label="Privacy Centre" />
            <Row to="/settings/account" icon={User} label="Account Status" />
            <Row to="/settings/help" icon={Info} label="About" />
      </div>
    </div>
      </MobileShell>
    </ThemedView>
  );
}
