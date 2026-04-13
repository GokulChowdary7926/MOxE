import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

export default function AccountEmailUsername() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.account) return;
        const acc = data.account;
        setAccountId(acc.id ?? null);
        setCurrentEmail(acc.user?.email ?? null);
        setPendingEmail(acc.pendingEmail ?? null);
        setUsername(acc.username ?? '');
      })
      .catch(() => {});
  }, []);

  async function handleRequestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailStatus(null);
    if (!newEmail.trim()) {
      setEmailError('Enter an email address.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setEmailError('You must be logged in.');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/accounts/me/email`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start email verification.');
      }
      setPendingEmail(newEmail.trim());
      setEmailStatus('Verification link sent. Check your inbox to confirm this email.');
      setNewEmail('');
    } catch (e: any) {
      setEmailError(e.message || 'Could not update email.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function checkUsernameAvailability(name: string) {
    setUsernameStatus(null);
    setUsernameError(null);
    if (!name.trim()) return;
    setUsernameChecking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/accounts/username/${encodeURIComponent(name.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        // username exists already
        setUsernameStatus(null);
        setUsernameError('This username is already taken.');
      } else if (res.status === 404) {
        setUsernameStatus('This username is available.');
        setUsernameError(null);
      } else {
        setUsernameError('Could not check username right now.');
      }
    } catch {
      setUsernameError('Could not check username right now.');
    } finally {
      setUsernameChecking(false);
    }
  }

  function handleUsernameBlur() {
    if (username.trim()) {
      checkUsernameAvailability(username);
    }
  }

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameStatus(null);
    setUsernameError(null);
    const name = username.trim();
    if (!name) {
      setUsernameError('Enter a username.');
      return;
    }
    if (!accountId) {
      setUsernameError('Account not loaded.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setUsernameError('You must be logged in.');
      return;
    }
    try {
      // Optional: quick availability recheck before saving
      await checkUsernameAvailability(name);
      if (usernameError) return;
      const res = await fetch(`${API_BASE}/accounts/${encodeURIComponent(accountId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            'Could not update username. Remember it can only be changed once every 14 days.',
        );
      }
      setUsernameStatus('Username updated.');
      setUsernameError(null);
    } catch (e: any) {
      setUsernameStatus(null);
      setUsernameError(e.message || 'Could not update username.');
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Email & username"
        left={
          <Link to="/settings/account" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-8">
        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Email
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-2">
            <ThemedText className="text-moxe-body">
              Current email:{' '}
              <span className="font-semibold">
                {currentEmail || 'Not added'}
              </span>
            </ThemedText>
            {pendingEmail && (
              <ThemedText secondary className="text-moxe-caption">
                Pending verification:{' '}
                <span className="font-semibold">{pendingEmail}</span>
              </ThemedText>
            )}
            <form onSubmit={handleRequestEmailChange} className="mt-2 space-y-2">
              <ThemedInput
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Add or change your email"
              />
              <ThemedButton
                type="submit"
                label={emailLoading ? 'Sending link…' : 'Send verification link'}
                disabled={emailLoading}
                className="w-full justify-center"
              />
            </form>
            {emailStatus && (
              <ThemedText secondary className="text-moxe-caption mt-1 block text-moxe-primary">
                {emailStatus}
              </ThemedText>
            )}
            {emailError && (
              <ThemedText className="text-moxe-caption mt-1 block text-moxe-danger">
                {emailError}
              </ThemedText>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Username
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-2">
            <ThemedText secondary className="text-moxe-caption">
              Usernames can only be changed occasionally. If you switch, your old handle may become available
              for others after a short period.
            </ThemedText>
            <form onSubmit={handleSaveUsername} className="space-y-2">
              <ThemedInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={handleUsernameBlur}
                placeholder="@handle"
              />
              <ThemedButton
                type="submit"
                label="Save username"
                className="w-full justify-center text-xs"
              />
            </form>
            {usernameChecking && (
              <ThemedText secondary className="text-moxe-caption">
                Checking availability…
              </ThemedText>
            )}
            {usernameStatus && !usernameChecking && (
              <ThemedText className="text-moxe-caption text-moxe-primary">
                {usernameStatus}
              </ThemedText>
            )}
            {usernameError && !usernameChecking && (
              <ThemedText className="text-moxe-caption text-moxe-danger">
                {usernameError}
              </ThemedText>
            )}
          </div>
        </section>
      </div>
    </ThemedView>
  );
}

