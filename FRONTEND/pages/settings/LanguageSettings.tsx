import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

type LangCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ja' | 'ko';

const LANGUAGES: { label: string; value: string }[] = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
];

export default function LanguageSettings() {
  const [value, setValue] = useState<LangCode>('en');

  return (
    <SettingsPageShell title="Set language" backTo="/settings/language">
      <SettingsRadioSection
        name="app-language"
        title="App language"
        value={value}
        onChange={(v) => setValue(v as LangCode)}
        options={LANGUAGES}
      />
    </SettingsPageShell>
  );
}
