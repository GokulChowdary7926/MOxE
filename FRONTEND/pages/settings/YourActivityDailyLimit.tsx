import React, { useState } from 'react';
import { PageLayout, SettingsRadioSection } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';

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
    <PageLayout title="Daily limit" backTo="/activity">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          Set a daily time limit for how long you want to spend on MOxE each day. We’ll remind you when you’ve
          reached your limit.
        </ThemedText>

        <SettingsRadioSection
          title="Daily limit"
          options={OPTIONS}
          value={value}
          onChange={(v) => setValue(v as DailyLimitValue)}
        />
      </div>
    </PageLayout>
  );
}

