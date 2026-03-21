import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { UserPlus, Bell, Lock } from 'lucide-react';
import LeafletMap from '../../components/map/LeafletMap';
import { getApiBase, getToken } from '../../services/api';

const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];

export default function ManageContactsPage() {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [shareLiveLocation, setShareLiveLocation] = useState(true);
  const [mapMounted, setMapMounted] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  useEffect(() => setMapMounted(true), []);

  useEffect(() => {
    async function loadContacts() {
      const token = getToken();
      if (!token) {
        setContacts([]);
        setLoadingContacts(false);
        return;
      }
      try {
        const res = await fetch(`${getApiBase()}/emergency-contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load contacts.');
        setContacts(data ?? []);
      } catch {
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadContacts();
  }, []);

  const removeContact = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/emergency-contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  const setPrimary = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/emergency-contacts/${id}/primary`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === id })));
    } catch {
      // ignore
    }
  };

  return (
    <SettingsPageShell title="Manage Contacts" backTo="/map/sos">
      <div className="px-4 py-4 space-y-6">
        <Link
          to="/map/sos/contacts/add"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-black font-bold"
        >
          <UserPlus className="w-5 h-5" />
          Add New Contact
        </Link>

        <div>
          <p className="text-white font-semibold mb-2">Your emergency contacts</p>
          {loadingContacts ? (
            <p className="text-[#a8a8a8] text-sm">Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="text-[#a8a8a8] text-sm">No emergency contacts yet.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-[#262626] border border-[#363636] px-3 py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      @{c.contact?.username ?? 'user'}
                      {c.contact?.displayName ? ` · ${c.contact.displayName}` : ''}
                    </p>
                    <p className="text-[#a8a8a8] text-xs truncate">
                      {c.relationship || 'Contact'} {c.isPrimary ? '· Primary' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!c.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(c.id)}
                        className="px-2 py-1 text-[11px] rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="px-2 py-1 text-[11px] rounded-lg bg-[#363636] text-[#a8a8a8] font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="text-white font-semibold">Alert Preferences</span>
          </div>
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
              <div>
                <p className="text-white font-medium">Send SMS Alerts</p>
                <p className="text-[#a8a8a8] text-sm">Notify contacts via SMS during emergencies.</p>
              </div>
              <button type="button" onClick={() => setSmsAlerts(!smsAlerts)} className={`w-11 h-6 rounded-full flex-shrink-0 ${smsAlerts ? 'bg-emerald-600' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${smsAlerts ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
              <div>
                <p className="text-white font-medium">Send Email Alerts</p>
                <p className="text-[#a8a8a8] text-sm">Notify contacts via email during emergencies.</p>
              </div>
              <button type="button" onClick={() => setEmailAlerts(!emailAlerts)} className={`w-11 h-6 rounded-full flex-shrink-0 ${emailAlerts ? 'bg-emerald-600' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${emailAlerts ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-white font-medium">Share Live Location</p>
                <p className="text-[#a8a8a8] text-sm">Share your real-time location during emergencies.</p>
              </div>
              <button type="button" onClick={() => setShareLiveLocation(!shareLiveLocation)} className={`w-11 h-6 rounded-full flex-shrink-0 ${shareLiveLocation ? 'bg-emerald-600' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${shareLiveLocation ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-white font-medium mb-2">Your current location is shown on the map below:</p>
          {mapMounted && (
            <div className="aspect-video rounded-xl overflow-hidden border border-[#363636] mb-2">
              <LeafletMap
                center={DEFAULT_CENTER}
                zoom={14}
                className="w-full h-full min-h-[200px]"
                showUserLocation={true}
              />
            </div>
          )}
          <p className="text-[#a8a8a8] text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Your location is only shared during emergencies.
          </p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
