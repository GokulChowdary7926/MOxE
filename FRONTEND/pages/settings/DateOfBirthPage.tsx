import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

export default function DateOfBirthPage() {
  const navigate = useNavigate();
  const [dateStr, setDateStr] = useState('2005-07-07');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Date of birth</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto p-4">
          <p className="text-[#a8a8a8] text-sm mb-4">Providing your date of birth helps make sure that you get the right experience for your age.</p>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#262626] border border-[#363636]">
            <span className="text-white">
              {dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select date'}
            </span>
            <button type="button" className="text-white text-sm font-medium">Edit</button>
          </div>
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="sr-only" id="dob-input" />
          <p className="mt-4"><span className="text-[#0095f6] text-sm">Who can see your date of birth</span></p>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
