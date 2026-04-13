import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type RowProps = {
  label: string;
  description?: string;
};

function SettingsRow({ label, description }: RowProps) {
  return (
    <div className="px-3 py-3 border-b border-moxe-border last:border-0">
      <ThemedText className="text-moxe-body font-medium">{label}</ThemedText>
      {description ? (
        <ThemedText secondary className="text-moxe-caption mt-0.5 block">
          {description}
        </ThemedText>
      ) : null}
    </div>
  );
}

type BusinessHoursDay = {
  key: string;
  label: string;
  open: string;
  close: string;
  closed: boolean;
};

type ActionButtonsConfig = {
  call?: string;
  email?: string;
  directions?: string;
  website?: string;
  whatsapp?: string;
};

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB'>('PERSONAL');
  const [businessCategory, setBusinessCategory] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHoursDay[]>([
    { key: 'mon', label: 'Mon', open: '09:00', close: '18:00', closed: false },
    { key: 'tue', label: 'Tue', open: '09:00', close: '18:00', closed: false },
    { key: 'wed', label: 'Wed', open: '09:00', close: '18:00', closed: false },
    { key: 'thu', label: 'Thu', open: '09:00', close: '18:00', closed: false },
    { key: 'fri', label: 'Fri', open: '09:00', close: '18:00', closed: false },
    { key: 'sat', label: 'Sat', open: '10:00', close: '16:00', closed: false },
    { key: 'sun', label: 'Sun', open: '00:00', close: '00:00', closed: true },
  ]);
  const [actionButtons, setActionButtons] = useState<ActionButtonsConfig>({});
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.account) return;
        const acc = data.account;
        if (acc.accountType) {
          setAccountType(acc.accountType as typeof accountType);
        }
        if (acc.businessCategory) setBusinessCategory(acc.businessCategory as string);
        if (acc.contactEmail) setContactEmail(acc.contactEmail as string);
        if (acc.contactPhone) setContactPhone(acc.contactPhone as string);
        if (acc.contactAddress) setContactAddress(acc.contactAddress as string);
        if (acc.businessHours && typeof acc.businessHours === 'object') {
          setBusinessHours((prev) =>
            prev.map((day) => {
              const stored = (acc.businessHours as any)[day.key];
              if (!stored) return day;
              return {
                ...day,
                open: stored.open ?? day.open,
                close: stored.close ?? day.close,
                closed: stored.closed ?? false,
              };
            }),
          );
        }
        if (acc.actionButtons && typeof acc.actionButtons === 'object') {
          setActionButtons(acc.actionButtons as ActionButtonsConfig);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function patchAccount(payload: Record<string, unknown>) {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/accounts/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async function handleSwitchToBusiness() {
    if (accountType === 'BUSINESS') return;
    setAccountType('BUSINESS');
    try {
      await patchAccount({ accountType: 'BUSINESS' });
    } catch {
      // ignore errors; user can retry
    }
  }

  async function handleSwitchToCreator() {
    if (accountType === 'CREATOR') return;
    setAccountType('CREATOR');
    try {
      await patchAccount({ accountType: 'CREATOR' });
    } catch {
      // ignore errors; user can retry
    }
  }

  async function handleSaveBusinessProfile() {
    setSavingBusiness(true);
    const hoursPayload: Record<string, { open: string; close: string; closed: boolean }> = {};
    for (const day of businessHours) {
      hoursPayload[day.key] = { open: day.open, close: day.close, closed: day.closed };
    }
    try {
      await patchAccount({
        businessCategory: businessCategory || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contactAddress: contactAddress || null,
        businessHours: hoursPayload,
        actionButtons,
      });
    } catch {
      // ignore for now
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleSaveCreatorProfile() {
    setSavingBusiness(true);
    try {
      await patchAccount({
        businessCategory: businessCategory || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contactAddress: contactAddress || null,
        actionButtons,
      });
    } catch {
      // ignore for now
    } finally {
      setSavingBusiness(false);
    }
  }

  if (loading) {
    return (
      <ThemedView className="min-h-screen flex items-center justify-center pb-20">
        <ThemedText secondary>Loading account…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <PageLayout title="Account" backTo="/settings">
      <div className="py-4 space-y-6">
        <ThemedText secondary className="text-moxe-caption leading-relaxed">
          Core MOxE Basic account management lives here: phone, email, username, display name,
          birthday, profile photo, bio, link in bio, and pronouns. These controls are shared across
          Personal, Business, Creator, and Job accounts.
        </ThemedText>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Login &amp; security
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Phone number"
              description="Change number, verify with SMS, and manage up to 3 accounts per phone."
            />
                    <Link to="/settings/account/email-username" className="block">
                      <SettingsRow
                        label="Email & username"
                        description="Add or change email, verify ownership, and manage your @handle."
                      />
                    </Link>
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Profile identity
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Display name"
              description="Name shown on your profile, supports emojis and special characters."
            />
            <SettingsRow
              label="Date of birth"
              description="Birthday, age checks, and minor safety rules based on MOxE Basic."
            />
            <SettingsRow
              label="Profile photo"
              description="Upload, crop, apply filters and frames, with safety moderation."
            />
            <SettingsRow
              label="Bio"
              description="Profile bio with emojis, @mentions, #hashtags, and line breaks."
            />
            <SettingsRow
              label="Link in bio"
              description="Primary link with URL validation and basic click tracking."
            />
            <SettingsRow
              label="Pronouns"
              description="Select from common pronouns or add custom, with visibility controls."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Account type &amp; devices
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Account type"
              description="Switch between Personal, Business, Creator, and Job when available."
            />
            <SettingsRow
              label="Logged-in devices"
              description="See where you’re signed in and sign out of other devices."
            />
            <div className="px-3 py-3 border-t border-moxe-border">
              <div className="flex items-center justify-between mb-1">
                <ThemedText className="text-moxe-body font-medium">Switch to Business</ThemedText>
                <button
                  type="button"
                  onClick={handleSwitchToBusiness}
                  disabled={accountType === 'BUSINESS'}
                  className={`px-3 py-1.5 rounded-moxe-md text-[13px] font-medium ${
                    accountType === 'BUSINESS'
                      ? 'bg-moxe-surface border border-moxe-border text-moxe-caption cursor-default'
                      : 'bg-moxe-primary text-white'
                  }`}
                >
                  {accountType === 'BUSINESS' ? 'Business active' : 'Switch'}
                </button>
              </div>
              <ThemedText secondary className="text-moxe-caption">
                Unlock MOxE Business tools like Commerce, orders, and analytics. Your followers and posts stay the same.
              </ThemedText>
            </div>
            <div className="px-3 py-3 border-t border-moxe-border">
              <div className="flex items-center justify-between mb-1">
                <ThemedText className="text-moxe-body font-medium">Switch to Creator</ThemedText>
                <button
                  type="button"
                  onClick={handleSwitchToCreator}
                  disabled={accountType === 'CREATOR'}
                  className={`px-3 py-1.5 rounded-moxe-md text-[13px] font-medium ${
                    accountType === 'CREATOR'
                      ? 'bg-moxe-surface border border-moxe-border text-moxe-caption cursor-default'
                      : 'bg-moxe-primary text-white'
                  }`}
                >
                  {accountType === 'CREATOR' ? 'Creator active' : 'Switch'}
                </button>
              </div>
              <ThemedText secondary className="text-moxe-caption">
                Live badges, gifts, creator analytics, content tools, and collaboration. All features included.
              </ThemedText>
            </div>
          </div>
        </section>

        {(accountType === 'CREATOR' || accountType === 'BUSINESS') && (
          <section>
            <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
              {accountType === 'CREATOR' ? 'Creator profile' : 'Business profile'}
            </h2>
            <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
              <div className="px-3 py-3 border-b border-moxe-border">
                <ThemedText className="text-moxe-body font-medium mb-1">
                  {accountType === 'CREATOR' ? 'Creator category' : 'Business category'}
                </ThemedText>
                <input
                  type="text"
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder={accountType === 'CREATOR' ? 'e.g. Photography, Travel, Fitness' : 'e.g. Home & Living · Candles'}
                  className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                />
                <ThemedText secondary className="text-moxe-caption mt-1 block">
                  Helps MOxE show you in the right places (Explore, search, and recommendations).
                </ThemedText>
              </div>

              <div className="px-3 py-3 border-b border-moxe-border">
                <ThemedText className="text-moxe-body font-medium mb-1">
                  {accountType === 'CREATOR' ? 'Creator contact' : 'Business contact'}
                </ThemedText>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Business email"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Business phone"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <textarea
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Business address"
                    rows={2}
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm resize-none"
                  />
                </div>
                <ThemedText secondary className="text-moxe-caption mt-1 block">
                  Shown on your profile with Call, Email, Directions, and WhatsApp buttons.
                </ThemedText>
              </div>

              {accountType === 'BUSINESS' && (
              <div className="px-3 py-3 border-b border-moxe-border">
                <ThemedText className="text-moxe-body font-medium mb-1">Business hours</ThemedText>
                <div className="space-y-1">
                  {businessHours.map((day, idx) => (
                    <div key={day.key} className="flex items-center gap-2">
                      <span className="w-10 text-[11px] text-moxe-caption">{day.label}</span>
                      <label className="flex items-center gap-1 text-[11px] text-moxe-caption">
                        <input
                          type="checkbox"
                          checked={day.closed}
                          onChange={(e) =>
                            setBusinessHours((prev) =>
                              prev.map((d, i) =>
                                i === idx ? { ...d, closed: e.target.checked } : d,
                              ),
                            )
                          }
                        />
                        Closed
                      </label>
                      {!day.closed && (
                        <>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) =>
                              setBusinessHours((prev) =>
                                prev.map((d, i) =>
                                  i === idx ? { ...d, open: e.target.value } : d,
                                ),
                              )
                            }
                            className="px-2 py-1 rounded-moxe-md bg-moxe-background border border-moxe-border text-[11px] text-moxe-body flex-1"
                          />
                          <span className="text-[11px] text-moxe-caption">–</span>
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) =>
                              setBusinessHours((prev) =>
                                prev.map((d, i) =>
                                  i === idx ? { ...d, close: e.target.value } : d,
                                ),
                              )
                            }
                            className="px-2 py-1 rounded-moxe-md bg-moxe-background border border-moxe-border text-[11px] text-moxe-body flex-1"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <ThemedText secondary className="text-moxe-caption mt-1 block">
                  Used to show “Open now” / “Closed” badges in the Business Dashboard and profile.
                </ThemedText>
              </div>
              )}

              <div className="px-3 py-3">
                <ThemedText className="text-moxe-body font-medium mb-1">Action buttons</ThemedText>
                <ThemedText secondary className="text-moxe-caption mb-2 block">
                  Configure quick actions that appear as buttons on your profile.
                </ThemedText>
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={actionButtons.call ?? ''}
                    onChange={(e) =>
                      setActionButtons((prev) => ({ ...prev, call: e.target.value || undefined }))
                    }
                    placeholder="Call button phone number"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <input
                    type="email"
                    value={actionButtons.email ?? ''}
                    onChange={(e) =>
                      setActionButtons((prev) => ({ ...prev, email: e.target.value || undefined }))
                    }
                    placeholder="Email button address"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <input
                    type="text"
                    value={actionButtons.directions ?? ''}
                    onChange={(e) =>
                      setActionButtons((prev) => ({
                        ...prev,
                        directions: e.target.value || undefined,
                      }))
                    }
                    placeholder="Maps link for Directions button"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <input
                    type="url"
                    value={actionButtons.website ?? ''}
                    onChange={(e) =>
                      setActionButtons((prev) => ({
                        ...prev,
                        website: e.target.value || undefined,
                      }))
                    }
                    placeholder="Website / shop URL"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                  <input
                    type="tel"
                    value={actionButtons.whatsapp ?? ''}
                    onChange={(e) =>
                      setActionButtons((prev) => ({
                        ...prev,
                        whatsapp: e.target.value || undefined,
                      }))
                    }
                    placeholder="WhatsApp number (optional)"
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={accountType === 'CREATOR' ? handleSaveCreatorProfile : handleSaveBusinessProfile}
                  disabled={savingBusiness}
                  className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-moxe-md bg-moxe-primary text-white text-[13px] font-medium disabled:opacity-60"
                >
                  {savingBusiness ? 'Saving…' : accountType === 'CREATOR' ? 'Save creator profile' : 'Save business profile'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}

