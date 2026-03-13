import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PageLayout, SettingsSection, SettingsRow } from '../../components/layout/PageLayout';

const HELP_CENTER_URL = 'https://help.moxe.example.com';
const TERMS_URL = 'https://moxe.example.com/terms';
const PRIVACY_URL = 'https://moxe.example.com/privacy';

function HelpRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full py-3 px-4 border-b border-moxe-border last:border-b-0 text-left active:bg-moxe-surface/80"
    >
      <span className="text-moxe-body font-medium text-moxe-text">{label}</span>
      <ChevronRight className="w-4 h-4 text-moxe-textSecondary" />
    </button>
  );
}

export default function HelpSettings() {
  return (
    <PageLayout title="Help" backTo="/settings">
      <div className="py-4">
        <SettingsSection title="Support">
          <HelpRow label="Help Center" onClick={() => window.open(HELP_CENTER_URL, '_blank')} />
          <SettingsRow to="/settings/help/report" label="Report a Problem" />
        </SettingsSection>
        <SettingsSection title="Policies">
          <HelpRow label="Terms and Policies" onClick={() => window.open(TERMS_URL, '_blank')} />
          <HelpRow label="Privacy Policy" onClick={() => window.open(PRIVACY_URL, '_blank')} />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
