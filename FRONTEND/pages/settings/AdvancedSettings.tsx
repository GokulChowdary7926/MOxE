import React, { useState } from 'react';
import { ThemedText } from '../../components/ui/Themed';
import { PageLayout } from '../../components/layout/PageLayout';

type RowProps = {
  label: string;
  description?: string;
  trailing?: React.ReactNode;
};

function SettingsRow({ label, description, trailing }: RowProps) {
  return (
    <div className="flex items-start gap-3 px-3 py-3 border-b border-moxe-border last:border-0">
      <div className="flex-1">
        <ThemedText className="text-moxe-body font-medium">{label}</ThemedText>
        {description ? (
          <ThemedText secondary className="text-moxe-caption mt-0.5 block">
            {description}
          </ThemedText>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export default function AdvancedSettings() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [protectionEnabled, setProtectionEnabled] = useState(false);

  const toggle = (value: boolean, setter: (v: boolean) => void) => () => setter(!value);

  const renderToggle = (value: boolean, setter: (v: boolean) => void) => (
    <button
      type="button"
      onClick={toggle(value, setter)}
      className={`w-10 h-6 rounded-full flex items-center ${
        value ? 'bg-moxe-primary' : 'bg-moxe-border'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
          value ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <PageLayout title="Advanced" backTo="/settings">
      <div className="py-4 space-y-6">
        <ThemedText secondary className="text-moxe-caption leading-relaxed">
          Configure advanced MOxE Basic features like voice commands, Nearby messaging, Promity
          alerts, screenshot and download protection defaults, anonymous discussion spaces, and
          lifestyle streaks.
        </ThemedText>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Voice &amp; control
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Voice commands"
              description='Control MOxE hands‑free with commands like "Open profile", "Message [name]", "Create post", "Scroll down", and "Help".'
              trailing={renderToggle(voiceEnabled, setVoiceEnabled)}
            />
            <SettingsRow
              label="Voice safety shortcuts"
              description='Configure quick phrases for "SOS", "Help", and other safety actions.'
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Nearby &amp; proximity
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Nearby messaging"
              description="Opt in to discover and message people within a chosen radius at events or in your city."
              trailing={renderToggle(nearbyEnabled, setNearbyEnabled)}
            />
            <SettingsRow
              label="Promity alerts"
              description="Get notified when selected contacts are nearby (100m–1km) with customizable cooldowns."
              trailing={renderToggle(proximityEnabled, setProximityEnabled)}
            />
            <SettingsRow
              label="Nearby visibility"
              description="Choose who can see you in Nearby: Everyone, Followers Only, or Off."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Screenshot &amp; download protection
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Protect my content"
              description="Default to blocking downloads and detecting screenshots on new posts and stories."
              trailing={renderToggle(protectionEnabled, setProtectionEnabled)}
            />
            <SettingsRow
              label="Screenshot notifications"
              description="Choose when to be notified if someone attempts a screenshot of protected content."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Spaces &amp; streaks
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Anonymous discussion spaces"
              description="Browse, create, and moderate anonymous spaces with voting and reporting."
            />
            <SettingsRow
              label="Lifestyle streaks"
              description="Configure Gym, Meditation, Reading, Study, Gaming, Movies, or custom streaks."
            />
            <SettingsRow
              label="One‑time view media in DMs"
              description="Control defaults for sending and receiving one‑time view photos and videos."
            />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

