import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { UserPlus, Bell, Lock } from 'lucide-react';

export default function ManageContactsPage() {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [shareLiveLocation, setShareLiveLocation] = useState(true);

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
          <div className="aspect-video rounded-xl bg-[#262626] border border-[#363636] flex items-center justify-center text-[#737373] text-sm mb-2">
            [Map]
          </div>
          <p className="text-[#a8a8a8] text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Your location is only shared during emergencies.
          </p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
