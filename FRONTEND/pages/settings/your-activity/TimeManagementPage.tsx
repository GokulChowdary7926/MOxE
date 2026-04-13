import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Info, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../../components/ui/Themed';
import { MobileShell } from '../../../components/layout/MobileShell';
import { UI } from '../../../constants/uiTheme';

const DAYS = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Today'];
const BAR_HEIGHTS = [40, 85, 95, 70, 60, 90, 55]; // relative heights for bar chart

export default function TimeManagementPage() {
  const dailyAvg = '3h 48m';

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Time management</span>
          <button type="button" className="p-2 -m-2 text-white" aria-label="Info">
            <Info className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-20 px-4">
          <p className="text-2xl font-bold text-white mt-4">{dailyAvg}</p>
          <p className="text-[#a8a8a8] text-sm mt-1">Daily average</p>
          <p className="text-[#a8a8a8] text-sm mt-3">
            Average time that you spent per day using MOxE on this device in the last week.{' '}
            <span className="text-[#0095f6]">Learn more about balancing your time online.</span>
          </p>

          {/* Bar chart placeholder */}
          <div className="flex items-end gap-2 mt-6 h-24">
            {DAYS.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t bg-[#e1306c] min-h-[8px]"
                  style={{ height: `${BAR_HEIGHTS[i]}%` }}
                />
                <span className="text-[#737373] text-xs mt-1">{day}</span>
              </div>
            ))}
          </div>

          <h2 className="text-white font-semibold mt-8 mb-3">Manage your time</h2>
          <div className="rounded-xl overflow-hidden border border-[#262626] mb-4">
            <Link
              to="/settings/your-activity/time-spent"
              className="flex items-center justify-between px-4 py-3 bg-[#262626] active:bg-white/5 border-b border-[#363636]"
            >
              <span className="text-white font-medium">Time spent</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
            <Link
              to="/settings/your-activity/daily-limit"
              className="flex items-center justify-between px-4 py-3 bg-[#262626] active:bg-white/5"
            >
              <span className="text-white font-medium">Daily limit</span>
              <span className="text-[#737373] text-sm flex items-center gap-1">Off <ChevronRight className="w-4 h-4" /></span>
            </Link>
            <Link
              to="/settings/your-activity/sleep-mode"
              className="flex items-center justify-between px-4 py-3 border-t border-[#363636] active:bg-white/5"
            >
              <div>
                <span className="text-white font-medium block">Sleep mode</span>
                <span className="text-[#737373] text-xs">We&apos;ll remind you to close MOxE from 21:01 to 20:59 every day.</span>
              </div>
              <span className="text-[#737373] text-sm flex items-center gap-1">On <ChevronRight className="w-4 h-4" /></span>
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
