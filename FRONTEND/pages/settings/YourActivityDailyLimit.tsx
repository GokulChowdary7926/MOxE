import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

type DailyLimitValue = '15' | '30' | '45' | '60' | '120' | 'off';

const OPTIONS: { label: string; value: DailyLimitValue }[] = [
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '2 hours', value: '120' },
  { label: 'Off', value: 'off' },
];

export default function YourActivityDailyLimit() {
  const [value, setValue] = useState<DailyLimitValue>('off');

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/settings/your-activity/time-management" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Daily limit</span>
          <div className="w-14" />
        </header>

        <div className="flex-1 overflow-auto pb-20 px-4">
          <p className="text-[#a8a8a8] text-sm mt-4">
            We&apos;ll remind you to close MOxE when you spend this amount of time in a day. We&apos;ll also let you know when you&apos;re close to reaching the limit.
          </p>

          <div className="mt-6 space-y-0 divide-y divide-[#262626] rounded-xl overflow-hidden border border-[#262626]">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue(opt.value)}
                className="flex items-center justify-between w-full px-4 py-3 bg-[#262626] text-left active:bg-white/5"
              >
                <span className="text-white font-medium">{opt.label}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${value === opt.value ? 'border-[#0095f6] bg-[#0095f6]' : 'border-[#737373]'}`}>
                  {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
