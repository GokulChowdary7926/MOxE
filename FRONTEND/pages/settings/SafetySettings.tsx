import React from 'react';
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
  return (
    <PageLayout title="Safety & security" backTo="/settings">
      <div className="py-4 space-y-6">
        <ThemedText secondary className="text-moxe-caption leading-relaxed">
          Safety tools in MOxE Basic help you manage who can reach you, what you see, and how the
          app reacts in emergencies. This screen brings together Blocking, Restrict, Mute, Hidden
          words, Limit interactions, Temporary blocks, and SOS Safety Mode.
        </ThemedText>

            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                to="/settings/safety-center"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-moxe-md border border-moxe-border text-moxe-body text-moxe-text"
              >
                Open Safety center
              </Link>
              <Link
                to="/settings/help/community-guidelines"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-moxe-md border border-moxe-border text-moxe-body text-moxe-text"
              >
                Community guidelines
              </Link>
            </div>

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
            <Link to="/settings/hidden-words" className="block text-inherit no-underline">
              <SettingsRow
                label="Hidden words"
                description="Filter comments and message requests that contain certain words or phrases."
              />
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Limits &amp; temporary blocks
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <Link to="/settings/limit-interactions" className="block text-inherit no-underline">
              <SettingsRow
                label="Limit interactions"
                description="Temporarily limit comments, tags, and DMs from recent followers or people who don’t follow you."
              />
            </Link>
            <Link to="/settings/safety-center" className="block text-inherit no-underline">
              <SettingsRow
                label="Temporary block"
                description="Block someone for 24 hours, 7 days, or 30 days without making it permanent."
              />
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            SOS &amp; emergency safety
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
            <Link to="/map/sos" className="block text-inherit no-underline">
              <SettingsRow
                label="SOS safety mode"
                description="Use voice triggers or gestures to silently share your live location with trusted contacts when you feel unsafe."
              />
            </Link>
            <Link to="/settings/emergency-contacts" className="block text-inherit no-underline">
              <SettingsRow
                label="Emergency contacts"
                description="Choose who receives SOS alerts with your location."
              />
            </Link>
            <Link to="/map/sos" className="block text-inherit no-underline">
              <SettingsRow
                label="Hangout mode"
                description="Check-ins and hangout sessions live with your SOS tools and location sharing."
              />
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

