import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function BoostAgeGenderPage() {
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [male, setMale] = useState(true);
  const [female, setFemale] = useState(true);

  return (
    <SettingsPageShell title="Age and gender" backTo="/boost/create-audience" right={<button type="button" className="text-[#0095f6] font-medium text-sm">Done</button>}>
      <div className="px-4 py-4">
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-[#a8a8a8] text-sm flex items-center justify-center gap-1">Estimated audience size <span className="text-[#737373]">ⓘ</span></p>
          <p className="text-[#737373] text-xs mt-1">Shown when forecasting is available.</p>
        </div>

        <p className="text-white font-semibold mb-2">Age</p>
        <div className="flex items-center gap-2 mb-2">
          <input type="number" min={18} max={65} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="w-16 px-2 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-center" />
          <span className="text-[#a8a8a8]">–</span>
          <input type="number" min={18} max={65} value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="w-16 px-2 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-center" />
        </div>
        <input type="range" min={18} max={65} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="w-full accent-[#0095f6] mb-4" />

        <p className="text-white font-semibold mb-2">Gender</p>
        <label className="flex items-center justify-between py-3 border-b border-[#262626] cursor-pointer">
          <span className="text-white">Male</span>
          <input type="checkbox" checked={male} onChange={() => setMale(!male)} className="w-5 h-5 rounded border-2 border-[#363636] accent-[#0095f6]" />
        </label>
        <label className="flex items-center justify-between py-3 border-b border-[#262626] cursor-pointer">
          <span className="text-white">Female</span>
          <input type="checkbox" checked={female} onChange={() => setFemale(!female)} className="w-5 h-5 rounded border-2 border-[#363636] accent-[#0095f6]" />
        </label>
      </div>
    </SettingsPageShell>
  );
}
