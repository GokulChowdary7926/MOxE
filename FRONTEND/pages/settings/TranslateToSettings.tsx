import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const LANGUAGES = [
  'Arabic', 'Bangla', 'Chinese', 'French', 'German', 'Hindi', 'Indonesian', 'Italian',
  'Japanese', 'Kannada', 'Korean', 'Marathi', 'Persian', 'Portuguese', 'Spanish', 'Tamil', 'Turkish',
];

export default function TranslateToSettings() {
  const [selected, setSelected] = useState<string>('auto');

  return (
    <SettingsPageShell title="Translate to" backTo="/settings/language">
      <div className="px-4 py-2">
        <label className="flex items-center justify-between py-3 cursor-pointer active:opacity-80">
          <div>
            <span className="text-white font-medium block">Automatically detect</span>
            <span className="text-[#a8a8a8] text-sm">English</span>
          </div>
          <input type="radio" name="translate-to" checked={selected === 'auto'} onChange={() => setSelected('auto')} className="sr-only" />
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected === 'auto' ? 'border-white' : 'border-[#363636]'}`}>
            {selected === 'auto' && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
          </span>
        </label>
        {LANGUAGES.map((lang) => (
          <label key={lang} className="flex items-center justify-between py-3 cursor-pointer active:opacity-80">
            <span className="text-white font-medium">{lang}</span>
            <input type="radio" name="translate-to" checked={selected === lang} onChange={() => setSelected(lang)} className="sr-only" />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected === lang ? 'border-white' : 'border-[#363636]'}`}>
              {selected === lang && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
        ))}
      </div>
    </SettingsPageShell>
  );
}
