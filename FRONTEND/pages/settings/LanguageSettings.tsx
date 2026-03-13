import React, { useState } from 'react';
import { PageLayout, SettingsRadioSection } from '../../components/layout/PageLayout';

type LangCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ja' | 'ko';

const LANGUAGES: { label: string; value: LangCode }[] = [
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
    <PageLayout title="Language" backTo="/settings">
      <div className="py-4">
        <SettingsRadioSection
          title="App language"
          options={LANGUAGES}
          value={value}
          onChange={(v) => setValue(v as LangCode)}
        />
      </div>
    </PageLayout>
  );
}
