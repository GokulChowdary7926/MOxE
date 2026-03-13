import React from 'react';
import { PageLayout, SettingsSection } from '../../../components/layout/PageLayout';
import { ThemedText } from '../../../components/ui/Themed';
import { mockLinkHistory } from '../../../mocks/activity';

export default function LinkHistory() {
  return (
    <PageLayout title="Link history" backTo="/activity">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          Links you’ve opened from MOxE.
        </ThemedText>
        <SettingsSection title="History">
          <div className="divide-y divide-moxe-border">
            {mockLinkHistory.map((entry) => (
              <div
                key={entry.id}
                className="py-3 px-4"
              >
                <ThemedText className="text-moxe-body font-medium text-moxe-text block truncate">
                  {entry.title ?? entry.url}
                </ThemedText>
                <ThemedText secondary className="text-moxe-caption block truncate mt-0.5">
                  {entry.url}
                </ThemedText>
                <ThemedText secondary className="text-moxe-caption text-[11px] mt-1">
                  {new Date(entry.clickedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </ThemedText>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
