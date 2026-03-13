import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedInput, ThemedButton } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Contact = {
  id: string;
  contactId: string;
  relationship: string;
  isPrimary: boolean;
  contact?: { id: string; username: string; displayName?: string | null };
};

export default function EmergencyContacts() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to manage emergency contacts.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/emergency-contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load contacts.');
        }
        setItems(data ?? []);
      } catch (e: any) {
        setError(e.message || 'Failed to load contacts.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    const uname = username.trim();
    if (!uname) return;
    setSaving(true);
    setError(null);
    try {
      const uRes = await fetch(
        `${API_BASE}/accounts/username/${encodeURIComponent(uname)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const uData = await uRes.json().catch(() => ({}));
      if (!uRes.ok || !uData.id) {
        throw new Error('Could not find that account.');
      }
      const res = await fetch(`${API_BASE}/emergency-contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: uData.id,
          relationship: relationship.trim() || 'Contact',
          isPrimary: !items.some((c) => c.isPrimary),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add contact.');
      }
      setItems((prev) => [...prev, data]);
      setUsername('');
      setRelationship('');
    } catch (e: any) {
      setError(e.message || 'Failed to add contact.');
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/emergency-contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  async function setPrimary(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/emergency-contacts/${id}/primary`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setItems((prev) =>
        prev.map((c) => ({ ...c, isPrimary: c.id === id })),
      );
    } catch {
      // ignore
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Emergency contacts"
        left={
          <Link to="/settings/safety" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading contacts…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            People we notify first when you trigger SOS.
          </ThemedText>
          {items.length === 0 && !loading && (
            <ThemedText secondary className="text-moxe-caption">
              You haven&apos;t added any emergency contacts yet.
            </ThemedText>
          )}
          <div className="space-y-2">
            {items.map((c) => (
              <div
                key={c.id}
                className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <ThemedText className="text-moxe-body">
                    @{c.contact?.username ?? 'user'}
                    {c.contact?.displayName ? ` · ${c.contact.displayName}` : ''}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {c.relationship}
                    {c.isPrimary ? ' · Primary' : ''}
                  </ThemedText>
                </div>
                <div className="flex gap-2">
                  {!c.isPrimary && (
                    <ThemedButton
                      label="Make primary"
                      variant="secondary"
                      onClick={() => setPrimary(c.id)}
                      className="px-3 py-1 text-[11px]"
                    />
                  )}
                  <ThemedButton
                    label="Remove"
                    variant="secondary"
                    onClick={() => removeContact(c.id)}
                    className="px-3 py-1 text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Add a new emergency contact
          </ThemedText>
          <form onSubmit={addContact} className="space-y-2">
            <ThemedInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (e.g. emma_moxe)"
            />
            <ThemedInput
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Relationship (e.g. Friend, Parent)"
            />
            <ThemedButton
              type="submit"
              label={saving ? 'Saving…' : 'Add contact'}
              disabled={saving || !username.trim()}
              className="w-full justify-center text-xs"
            />
          </form>
        </section>
      </div>
    </ThemedView>
  );
}

