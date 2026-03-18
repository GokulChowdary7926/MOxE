import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../../components/ui/Themed';
import { MobileShell } from '../../../components/layout/MobileShell';
import { UI } from '../../../constants/uiTheme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function SleepModePage() {
  const [on, setOn] = useState(true);
  const [startTime, setStartTime] = useState('21:01');
  const [endTime, setEndTime] = useState('20:59');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const toggleDay = (i: number) => {
    setSelectedDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
    );
  };

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/settings/your-activity/time-management" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Sleep mode</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-24 px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-white font-semibold">Sleep mode</h2>
              <p className="text-[#a8a8a8] text-sm mt-1">
                Your notifications will be muted during the times you choose. People will see that you&apos;re in sleep mode.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => setOn((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="border-t border-[#262626] pt-4">
            <Link to="#" className="flex items-center justify-between py-3">
              <span className="text-white">Start time</span>
              <span className="text-[#a8a8a8] flex items-center">{startTime} <ChevronRight className="w-4 h-4 ml-1" /></span>
            </Link>
            <Link to="#" className="flex items-center justify-between py-3 border-t border-[#262626]">
              <span className="text-white">End time</span>
              <span className="text-[#a8a8a8] flex items-center">{endTime} <ChevronRight className="w-4 h-4 ml-1" /></span>
            </Link>
          </div>

          <h3 className="text-white font-medium mt-6 mb-2">Choose days</h3>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-full text-sm font-medium ${selectedDays.includes(i) || selectedDays.length === 0 ? 'bg-[#363636] text-white' : 'bg-[#262626] text-[#737373] border border-[#363636]'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-[#737373] text-sm mt-2">Sleep mode is on every day.</p>

          <button
            type="button"
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-8"
          >
            Save
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
