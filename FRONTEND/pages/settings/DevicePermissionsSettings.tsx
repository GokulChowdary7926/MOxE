import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const PERMISSIONS = [
  { label: 'Camera', value: 'Allowed' },
  { label: 'Contacts', value: 'Allowed' },
  { label: 'Location services', value: 'Allowed' },
  { label: 'Microphone', value: 'Allowed' },
  { label: 'Notifications', value: 'Allowed' },
  { label: 'Photos', value: 'Allowed • All photos' },
];

export default function DevicePermissionsSettings() {
  return (
    <SettingsPageShell title="Device permissions" backTo="/settings">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">Your preferences</p>
      <div className="border-t border-[#262626]">
        {PERMISSIONS.map((p) => (
          <Link
            key={p.label}
            to={`/settings/device-permissions/${p.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
          >
            <span className="font-medium">{p.label}</span>
            <span className="flex items-center gap-1 text-[#a8a8a8] text-sm">
              {p.value}
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </span>
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
