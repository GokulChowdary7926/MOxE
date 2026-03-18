import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { ChevronLeft, CheckCircle, Clock, Play, Square } from 'lucide-react';

export default function SafetyCheckinPage() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [running, setRunning] = useState(false);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-24">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/map/sos" className="flex items-center gap-1 text-white font-medium" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Safety Check-in</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-6">
          <p className="flex items-center gap-2 text-emerald-500 text-sm mb-6">
            <CheckCircle className="w-4 h-4" />
            Your live location is shared with emergency contacts
          </p>

          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-white font-bold">Safety Check-in</span>
            </div>
            <p className="text-[#a8a8a8] text-sm mb-4">Set a timer for when you expect to reach your destination safely (up to 24 hours).</p>
            <div className="text-center py-4 mb-4">
              <span className="text-4xl font-mono font-bold text-amber-500">00 : 00 : 00</span>
            </div>
            <div className="flex gap-4 justify-center mb-4">
              <div>
                <label className="block text-[#737373] text-xs mb-1">Hours</label>
                <div className="flex items-center gap-1">
                  <button type="button" className="w-8 h-8 rounded bg-[#363636] text-white text-lg leading-none">−</button>
                  <span className="w-10 text-center text-white font-mono">{hours}</span>
                  <button type="button" className="w-8 h-8 rounded bg-[#363636] text-white text-lg leading-none">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[#737373] text-xs mb-1">Minutes</label>
                <div className="flex items-center gap-1">
                  <button type="button" className="w-8 h-8 rounded bg-[#363636] text-white text-lg leading-none">−</button>
                  <span className="w-10 text-center text-white font-mono">{minutes}</span>
                  <button type="button" className="w-8 h-8 rounded bg-[#363636] text-white text-lg leading-none">+</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {[{ label: '01 min', v: 1 }, { label: '10 min', v: 10 }, { label: '1 hour', v: 60 }, { label: '24 hours', v: 1440 }].map(({ label }) => (
                <button key={label} type="button" className="px-3 py-2 rounded-lg bg-[#363636] text-amber-500 text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#363636] text-amber-500 font-semibold flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Start Timer
              </button>
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#363636] text-amber-500 font-semibold flex items-center justify-center gap-2">
                <Square className="w-5 h-5" /> Stop Timer
              </button>
            </div>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
