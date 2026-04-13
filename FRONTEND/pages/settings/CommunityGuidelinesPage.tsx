import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function CommunityGuidelinesPage() {
  return (
    <SettingsPageShell title="Community guidelines" backTo="/settings/help">
      <div className="px-4 py-4 space-y-4 text-[#e8e8e8] text-sm leading-relaxed">
        <p className="text-[#a8a8a8]">
          MOxE is for real people sharing authentically. These rules keep the platform safe and welcoming.
        </p>
        <section>
          <h2 className="text-white font-semibold text-base mb-1">Be respectful</h2>
          <p>
            Do not harass, threaten, or target others. Hate speech, slurs, and coordinated bullying are not
            allowed.
          </p>
        </section>
        <section>
          <h2 className="text-white font-semibold text-base mb-1">Follow the law</h2>
          <p>Do not use MOxE to break the law, including fraud, sale of illegal goods, or sharing CSAM.</p>
        </section>
        <section>
          <h2 className="text-white font-semibold text-base mb-1">Authentic identity</h2>
          <p>
            Impersonation, fake engagement, and deceptive monetization undermine trust. Report impersonation
            via Help.
          </p>
        </section>
        <section>
          <h2 className="text-white font-semibold text-base mb-1">Sexual content &amp; safety</h2>
          <p>
            Nudity and sexual content must follow MOxE policies and age restrictions. Non-consensual intimate
            imagery is prohibited.
          </p>
        </section>
        <section>
          <h2 className="text-white font-semibold text-base mb-1">Enforcement</h2>
          <p>
            We may remove content, restrict features, or disable accounts for violations. You can appeal via
            support in many cases.
          </p>
        </section>
        <p className="text-xs text-[#737373] pt-2">
          This page is a summary. Product-specific rules may appear in Help and during posting flows.
        </p>
      </div>
    </SettingsPageShell>
  );
}
