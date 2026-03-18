import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function LanguageTranslationsSettings() {
  const [translateText, setTranslateText] = useState(false);
  const [translateVoice, setTranslateVoice] = useState(false);

  return (
    <SettingsPageShell title="Language and translations" backTo="/settings">
      <h2 className="text-white font-semibold px-4 pt-4 pb-2">MOxE language</h2>
      <Link to="/settings/language/set" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Set language</span>
        <ChevronRight className="w-5 h-5 text-[#737373]" />
      </Link>

      <h2 className="text-white font-semibold px-4 pt-6 pb-2">Reels translations</h2>
      <Link to="/settings/language/translate-to" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Translate to</span>
        <span className="flex items-center gap-1 text-[#a8a8a8] text-sm">English<ChevronRight className="w-5 h-5 text-[#737373]" /></span>
      </Link>
      <Link to="/settings/language/dont-translate" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <div>
          <span className="font-medium block">Don&apos;t translate</span>
          <p className="text-[#a8a8a8] text-sm mt-0.5">Choose languages that you prefer to keep untranslated.</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#737373] flex-shrink-0" />
      </Link>
      <SettingsToggleRow
        label="Translate text on reels"
        checked={translateText}
        onChange={setTranslateText}
        description="See stickers and text in your preferred language when available."
      />
      <SettingsToggleRow
        label="Translate voice"
        checked={translateVoice}
        onChange={setTranslateVoice}
        description="Hear audio translated into your default language in the speaker's voice when available."
      />
    </SettingsPageShell>
  );
}
