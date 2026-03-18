import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Bell } from 'lucide-react';
import { mockProximityAlerts } from '../../mocks/proximityAlerts';
import { mockUsers } from '../../mocks/users';

export default function ProximityAlertsPage() {
  const [username, setUsername] = useState('');
  const [radius, setRadius] = useState(500);
  const [cooldown, setCooldown] = useState(30);
  const alerts = mockProximityAlerts.map((a) => ({
    ...a,
    username: mockUsers.find((u) => u.id === a.targetUserId)?.username ?? 'user',
  }));

  return (
    <SettingsPageShell title="Proximity Alerts" backTo="/map">
      <div className="px-4 py-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-[#a855f7]" />
          <span className="text-white font-semibold">Proximity Alerts</span>
        </div>
        <p className="text-[#a8a8a8] text-sm mb-4">Your private list of contacts for proximity alerts (up to 5 people). We&apos;ll notify you when you&apos;re within range.</p>

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[#262626] border border-[#363636]">
                <p className="text-[#a8a8a8] text-sm">
                  Alert for <span className="text-white font-medium">@{a.username}</span> within {(a.radiusKm * 1000) / 1000}km · cooldown {a.cooldownMinutes}m
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" className="px-2 py-1 rounded-lg bg-[#363636] text-white text-xs font-medium">{a.isActive ? 'Pause' : 'Resume'}</button>
                  <button type="button" className="px-2 py-1 rounded-lg bg-[#363636] text-red-400 text-xs font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username to track"
            className="w-full px-3 py-2.5 rounded-lg bg-[#363636] border border-[#262626] text-white placeholder:text-[#737373] text-sm mb-3"
          />
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-[#737373] text-xs mb-1">Radius</label>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#363636] border border-[#262626] text-white text-sm">
                <option value={100}>100 m</option>
                <option value={500}>500 m</option>
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[#737373] text-xs mb-1">Cooldown</label>
              <select value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#363636] border border-[#262626] text-white text-sm">
                <option value={5}>5 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>
          <button type="button" className="w-full py-3 rounded-xl bg-[#a855f7] text-white font-bold">Add trusted contact</button>
        </div>
      </div>
    </SettingsPageShell>
  );
}
