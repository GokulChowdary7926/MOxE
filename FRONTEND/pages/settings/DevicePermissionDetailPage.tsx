import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function DevicePermissionDetailPage() {
  const { perm } = useParams<{ perm: string }>();
  const [allowed, setAllowed] = useState(true);
  const label = perm ? perm.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Permission';

  return (
    <SettingsPageShell title={label} backTo="/settings/device-permissions">
      <div className="px-4 py-4">
        <SettingsToggleRow
          label={`Allow ${label}`}
          checked={allowed}
          onChange={setAllowed}
          description={`This app would like to use ${label}. You can turn it off to deny access.`}
        />
      </div>
    </SettingsPageShell>
  );
}
