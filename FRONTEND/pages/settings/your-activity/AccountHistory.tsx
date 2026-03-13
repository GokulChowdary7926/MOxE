import React from 'react';
import { PageLayout, SettingsSection } from '../../../components/layout/PageLayout';
import { ThemedText } from '../../../components/ui/Themed';
import { mockAccountHistory } from '../../../mocks/activity';

export default function AccountHistory() {
  return (
    <PageLayout title="Account history" backTo="/activity">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          Changes to your account, username, and contact info.
        </ThemedText>
        <SettingsSection title="History">
          <div className="divide-y divide-moxe-border">
            {mockAccountHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 px-4"
              >
                <ThemedText className="text-moxe-body font-medium text-moxe-text">
                  {entry.description}
                </ThemedText>
                <ThemedText secondary className="text-moxe-caption">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
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
