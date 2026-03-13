import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function SafetySettings() {
  const [limitsEnabled, setLimitsEnabled] = useState(false);
  const [sosEnabled, setSosEnabled] = useState(true);

  return (
    <PageLayout title="Safety & security" backTo="/settings">
      <div className="py-4 space-y-6">
        <ThemedText secondary className="text-moxe-caption leading-relaxed">
          Safety tools in MOxE Basic help you manage who can reach you, what you see, and how the
          app reacts in emergencies. This screen brings together Blocking, Restrict, Mute, Hidden
          words, Limit interactions, Temporary blocks, and SOS Safety Mode.
        </ThemedText>

            <Link
              to="/settings/safety-center"
              className="inline-flex items-center justify-center mt-3 px-3 py-1.5 rounded-moxe-md border border-moxe-border text-moxe-body text-moxe-text"
            >
              Open Safety center
            </Link>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Connections &amp; interactions
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <Link to="/blocked" className="block text-inherit no-underline">
              <SettingsRow
                label="Blocked accounts"
              description="See people you’ve blocked and optionally unblock or report them."
            />
            </Link>
            <Link to="/restricted" className="block text-inherit no-underline">
              <SettingsRow
                label="Restricted accounts"
                description="Manage people whose comments and DMs are quietly limited."
              />
            </Link>
            <Link to="/muted" className="block text-inherit no-underline">
              <SettingsRow
                label="Muted accounts"
              description="Review accounts whose posts or stories you’ve muted."
            />
            </Link>
            <SettingsRow
              label="Hidden words"
              description="Filter comments and message requests that contain certain words or phrases."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Limits &amp; temporary blocks
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="Limit interactions"
              description="Temporarily limit comments, tags, and DMs from recent followers or people who don’t follow you."
              trailing={
                <button
                  type="button"
                  onClick={() => setLimitsEnabled((v) => !v)}
                  className={`w-10 h-6 rounded-full flex items-center ${
                    limitsEnabled ? 'bg-moxe-primary' : 'bg-moxe-border'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                      limitsEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              }
            />
            <SettingsRow
              label="Temporary block"
              description="Block someone for 24 hours, 7 days, or 30 days without making it permanent."
            />
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            SOS &amp; emergency safety
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <SettingsRow
              label="SOS safety mode"
              description="Use voice triggers or gestures to silently share your live location with trusted contacts when you feel unsafe."
              trailing={
                <button
                  type="button"
                  onClick={() => setSosEnabled((v) => !v)}
                  className={`w-10 h-6 rounded-full flex items-center ${
                    sosEnabled ? 'bg-moxe-primary' : 'bg-moxe-border'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-moxe-background transform transition-transform ${
                      sosEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              }
            />
            <SettingsRow
              label="Emergency contacts"
              description="Choose who receives SOS alerts with your location."
            />
            <SettingsRow
              label="Hangout mode"
              description="Background listening for distress words when you’re meeting someone."
            />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

