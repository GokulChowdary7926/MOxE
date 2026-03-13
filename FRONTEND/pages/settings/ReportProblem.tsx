import React, { useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { ThemedButton } from '../../components/ui/Themed';

export default function ReportProblem() {
  const [message, setMessage] = useState('');

  return (
    <PageLayout title="Report a Problem" backTo="/settings/help">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          Describe the issue you're experiencing. We'll use this to improve MOxE.
        </ThemedText>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What went wrong?"
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder-moxe-textSecondary text-moxe-body focus:outline-none focus:ring-1 focus:ring-moxe-primary resize-none"
          aria-label="Problem description"
        />
        <ThemedButton
          label="Send"
          onClick={() => {}}
          className="w-full justify-center"
          disabled={!message.trim()}
        />
      </div>
    </PageLayout>
  );
}
