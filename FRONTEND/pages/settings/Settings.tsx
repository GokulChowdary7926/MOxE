import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { PageLayout, SettingsSection, SettingsRow } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

export default function Settings() {
  const currentAccount = useSelector((state: RootState) => state.account.currentAccount);
  const accountId = (currentAccount as any)?.id;
  const [form, setForm] = useState<{ isPrivate?: boolean }>({});

  useEffect(() => {
    if (!accountId) return;
    const token = getToken();
    fetch(`${getApiBase()}/accounts/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account) setForm({ isPrivate: data.account.isPrivate });
      });
  }, [accountId]);

  const accountsCount = 1;
  const closeFriendsCount = 8;

  return (
    <PageLayout title="Settings" backTo="/profile">
      <div className="py-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-moxe-textSecondary" />
          <input
            type="text"
            placeholder="Search settings"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder-moxe-textSecondary text-moxe-body focus:outline-none focus:ring-1 focus:ring-moxe-primary"
          />
        </div>

        <SettingsSection title="Your account">
          <SettingsRow to="/settings/accounts" label="MOxE accounts" value={`${accountsCount} account`} />
          <SettingsRow to="/settings/account" label="Account" value="Profile, login, account type" />
        </SettingsSection>

        <SettingsSection title="How you use MOxE">
          <SettingsRow to="/saved" label="Saved" />
          <SettingsRow to="/archive" label="Archive" />
          <SettingsRow to="/activity" label="Your activity" />
          <SettingsRow to="/settings/notifications" label="Notifications" />
          <SettingsRow to="/settings/your-activity/time" label="Time management" />
        </SettingsSection>

        <SettingsSection title="Privacy & safety">
          <SettingsRow
            to="/settings/privacy"
            label="Privacy"
            value={form.isPrivate ? 'Private account' : 'Public account'}
          />
          <SettingsRow to="/follow/requests" label="Follow requests" />
          <SettingsRow to="/close-friends" label="Close Friends" value={String(closeFriendsCount)} />
          <SettingsRow to="/settings/safety" label="Safety & security" />
          <SettingsRow to="/settings/advanced" label="Advanced controls" />
          <SettingsRow to="/settings/crossposting" label="Crossposting" />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow to="/settings/language" label="Language" value="English" />
          <SettingsRow to="/settings/help" label="Help" />
        </SettingsSection>

        <Link
          to="/profile"
          className="inline-block mt-2 text-moxe-primary text-moxe-body font-medium active:opacity-80"
        >
          Edit profile →
        </Link>
      </div>
    </PageLayout>
  );
}
