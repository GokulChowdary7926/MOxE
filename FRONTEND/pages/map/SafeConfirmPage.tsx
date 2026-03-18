import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { CheckCircle } from 'lucide-react';

export default function SafeConfirmPage() {
  return (
    <SettingsPageShell title="I'm Safe" backTo="/map/sos">
      <div className="px-4 py-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">You&apos;re safe</h2>
        <p className="text-[#a8a8a8] text-sm mb-6">Your emergency contacts have been notified that you&apos;re safe.</p>
        <Link to="/map/sos" className="py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold">Done</Link>
      </div>
    </SettingsPageShell>
  );
}
