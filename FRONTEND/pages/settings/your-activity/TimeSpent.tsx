import React from 'react';
import { PageLayout, SettingsSection } from '../../../components/layout/PageLayout';
import { ThemedText } from '../../../components/ui/Themed';
import { mockDailyUsage } from '../../../mocks/activity';

export default function TimeSpent() {
  return (
    <PageLayout title="Time spent" backTo="/activity">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          See how much time you spend on MOxE each day.
        </ThemedText>
        <SettingsSection title="Daily average">
          <div className="divide-y divide-moxe-border">
            {mockDailyUsage.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-3 px-4"
              >
                <ThemedText className="text-moxe-body text-moxe-text">
                  {day.label ?? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </ThemedText>
                <ThemedText secondary className="text-moxe-body">
                  {day.minutes} min
                </ThemedText>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
