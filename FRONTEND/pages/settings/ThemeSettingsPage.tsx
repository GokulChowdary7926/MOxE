import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

/**
 * Appearance is fixed to dark theme for the whole app (tokens + Leaflet dark basemap).
 */
export default function ThemeSettingsPage() {
  return (
    <SettingsPageShell title="Theme" backTo="/settings">
      <div className="px-4 py-4 space-y-3">
        <p className="text-white font-semibold text-sm">Dark mode</p>
        <p className="text-[#a8a8a8] text-sm leading-relaxed">
          MOxE uses a single dark interface everywhere. There is no light theme; contrast and colors follow the same
          tokens as Home, Explore, maps, and settings.
        </p>
      </div>
    </SettingsPageShell>
  );
}
