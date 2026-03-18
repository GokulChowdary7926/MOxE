import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { ChevronLeft, Mic, Bell, CheckCircle, AlertTriangle, Settings } from 'lucide-react';

export default function SOSPage() {
  const [protectionActive, setProtectionActive] = useState(false);
  const [voiceDetection, setVoiceDetection] = useState(true);
  const [backgroundOp, setBackgroundOp] = useState(true);
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/map" className="flex items-center gap-1 text-white font-medium" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Protection Mode</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-6">
          {/* Status */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-[#737373]" />
              <span className="text-white font-bold">Protection Mode: {protectionActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-[#a8a8a8] flex items-center gap-2"><span className="text-emerald-500">●</span> GPS: Active | Accuracy: 35m</p>
              <p className="text-[#a8a8a8] flex items-center gap-2"><span className="text-emerald-500">●</span> Speech Recognition: Ready</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['HELP', 'EMERGENCY', 'SOS', 'SAVE ME'].map((label) => (
                <button key={label} type="button" className="px-3 py-1.5 rounded-lg border-2 border-amber-400 text-amber-400 text-xs font-bold">
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProtectionActive(!protectionActive)}
              className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-black font-bold flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">▶</span>
              {protectionActive ? 'DEACTIVATE PROTECTION' : 'ACTIVATE PROTECTION'}
            </button>
            <div className="flex gap-2 mt-2">
              <button type="button" className="flex-1 py-2.5 rounded-xl bg-amber-500/80 text-black font-semibold text-sm flex items-center justify-center gap-1">
                <Bell className="w-4 h-4" /> Emergency Alert
              </button>
              <Link to="/map/sos/safe" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> I&apos;m Safe
              </Link>
            </div>
            <Link to="/map/sos/contacts" className="block mt-3 py-2.5 rounded-xl border border-amber-500/50 text-amber-500 font-medium text-sm text-center">Manage emergency contacts</Link>
            <Link to="/map/sos/safety-checkin" className="block mt-2 py-2.5 rounded-xl border border-[#363636] text-white font-medium text-sm text-center">Safety Check-in</Link>
          </div>

          {/* App Settings */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#363636]">
              <Settings className="w-5 h-5 text-[#a8a8a8]" />
              <span className="text-white font-semibold">App Settings</span>
            </div>
            {[
              { label: 'Enable Voice Detection', desc: 'Listen for distress keywords', value: voiceDetection, set: setVoiceDetection },
              { label: 'Enable Background Operation', desc: 'Keep protection active when app is in background', value: backgroundOp, set: setBackgroundOp },
              { label: 'Enable Auto-Checkin Reminders', desc: 'Remind you to check in during long trips', value: autoCheckin, set: setAutoCheckin },
              { label: 'Dark Theme', desc: 'Use dark interface', value: darkTheme, set: setDarkTheme },
              { label: 'Vibration Alerts', desc: 'Vibrate during emergencies', value: vibrationAlerts, set: setVibrationAlerts },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[#363636] last:border-b-0">
                <div>
                  <p className="text-white font-medium">{label}</p>
                  <p className="text-[#a8a8a8] text-sm">{desc}</p>
                </div>
                <button type="button" onClick={() => set(!value)} className={`w-11 h-6 rounded-full ${value ? 'bg-emerald-600' : 'bg-[#363636]'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${value ? 'ml-5' : 'ml-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
