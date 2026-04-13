import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

type InfoItem = {
  title: string;
  description: string;
  bullets: string[];
  backTo: string;
};

const INFO_MAP: Record<string, InfoItem> = {
  'help-account': {
    title: 'Account and login',
    description: 'Guidance for login, account access, password, and profile basics.',
    bullets: [
      'Use your verified email or mobile number for account recovery.',
      'Enable two-factor authentication for stronger security.',
      'Review login activity regularly from password and security settings.',
    ],
    backTo: '/settings/help/centre',
  },
  'help-privacy': {
    title: 'Privacy and security',
    description: 'How privacy controls work across posts, stories, and messages.',
    bullets: [
      'Set account privacy, story audience, and message controls based on your needs.',
      'Use block, restrict, mute, and hidden words for safer interactions.',
      'Use limit interactions when receiving unusual spam or abuse.',
    ],
    backTo: '/settings/help/centre',
  },
  'help-payments': {
    title: 'Payments and orders',
    description: 'Support information for orders, checkout, subscriptions, and payment settings.',
    bullets: [
      'Check order status from orders and payments settings.',
      'Manage cards and saved payment methods in MOxE Pay.',
      'Contact support with the order ID for refunds or payment disputes.',
    ],
    backTo: '/settings/help/centre',
  },
  'help-content': {
    title: 'Content and copyright',
    description: 'Information about ownership, reporting, and content controls.',
    bullets: [
      'Report copyright violations from post options.',
      'Use content preferences to tune recommendations.',
      'Review account status for policy warnings and content actions.',
    ],
    backTo: '/settings/help/centre',
  },
  'privacy-data': {
    title: 'How we use your data',
    description: 'Data is used to personalize feed ranking, safety checks, and account functionality.',
    bullets: [
      'You can download your data from archiving and downloading settings.',
      'You can review and clear search and link history.',
      'Privacy controls let you reduce visibility and discovery.',
    ],
    backTo: '/settings/privacy-centre/topics',
  },
  'privacy-ads': {
    title: 'Ads and data',
    description: 'Ad preferences and activity controls for account personalization.',
    bullets: [
      'Review ad preferences in account centre.',
      'Manage sensitive ad topics and recommendation limits.',
      'Use your activity controls to reduce unwanted content.',
    ],
    backTo: '/settings/privacy-centre/topics',
  },
  'privacy-sharing': {
    title: 'Sharing with others',
    description: 'Control who can mention, tag, message, and view your stories.',
    bullets: [
      'Adjust tags and mentions in privacy settings.',
      'Set story reply and resharing controls.',
      'Use close friends for private story sharing.',
    ],
    backTo: '/settings/privacy-centre/topics',
  },
  'privacy-security': {
    title: 'Security and storage',
    description: 'Security recommendations and storage behavior.',
    bullets: [
      'Enable login alerts and two-factor authentication.',
      'Review connected apps and website permissions.',
      'Clear app cache and browser data periodically.',
    ],
    backTo: '/settings/privacy-centre/topics',
  },
  'help-hidden-words': {
    title: 'Hidden words',
    description: 'Hidden words can filter comments and message requests with selected terms.',
    bullets: [
      'Add words or phrases separated by commas.',
      'Filtered requests are moved to hidden requests.',
      'You can update or remove words anytime.',
    ],
    backTo: '/settings/hidden-words',
  },
  'help-restricted-accounts': {
    title: 'Restricted accounts',
    description: 'Restricting reduces interaction impact without fully blocking an account.',
    bullets: [
      'Restricted users can still interact, but visibility is limited.',
      'You can unrestrict anytime from restricted accounts.',
      'Use block if you need stronger protection.',
    ],
    backTo: '/settings/restricted',
  },
  'help-contact-access': {
    title: 'Contact access',
    description: 'Contact sync helps suggest people you may know.',
    bullets: [
      'You can allow or revoke contact sync from device settings.',
      'Synced contacts are used for recommendations.',
      'Turning off sync does not remove already suggested accounts.',
    ],
    backTo: '/settings/following-invitations/contacts',
  },
  'help-nudity-protection': {
    title: 'Nudity protection',
    description: 'On-device technology blurs potentially sensitive photos in chats.',
    bullets: [
      'Protection runs before message media is shown.',
      'You can toggle protection on or off anytime.',
      'Report abusive accounts for repeated violations.',
    ],
    backTo: '/settings/messages/nudity-protection',
  },
  'payments-methods': {
    title: 'Payment methods',
    description: 'Manage cards and payment instruments used for checkout and subscriptions.',
    bullets: [
      'Add, remove, and update cards in orders and payments.',
      'Use security options like confirmation prompts when available.',
      'Review payment activity regularly.',
    ],
    backTo: '/settings/orders-payments/moxe-pay',
  },
  'resources-moxe-creators': {
    title: 'MOxE creators',
    description: 'Creator resources and growth tips on MOxE.',
    bullets: [
      'Use MOxE creator tools and insights for performance analysis.',
      'Review branded content and partnership settings.',
      'Keep your profile and content strategy aligned on MOxE.',
    ],
    backTo: '/settings/helpful-resources/moxe-creators',
  },
  'resources-creator-programme': {
    title: 'Creator programme',
    description: 'A guided path for growth, consistency, and monetization readiness.',
    bullets: [
      'Publish consistently and monitor audience retention.',
      'Use content pillars for stable creator branding.',
      'Review monetization eligibility in creator tools.',
    ],
    backTo: '/settings/helpful-resources/follow-creators',
  },
  'sleep-mode-start-time': {
    title: 'Sleep mode start time',
    description: 'Choose when quiet mode begins.',
    bullets: [
      'Set your preferred start time from Sleep mode settings.',
      'Notifications are muted during the configured window.',
      'You can temporarily disable Sleep mode anytime.',
    ],
    backTo: '/settings/your-activity/sleep-mode',
  },
  'sleep-mode-end-time': {
    title: 'Sleep mode end time',
    description: 'Choose when quiet mode ends.',
    bullets: [
      'Set your preferred end time from Sleep mode settings.',
      'Schedule can be adjusted per day in future updates.',
      'Status visibility can indicate that sleep mode is enabled.',
    ],
    backTo: '/settings/your-activity/sleep-mode',
  },
  'not-interested-topics': {
    title: 'Topics you have hidden',
    description: 'Review content topics marked as not interested.',
    bullets: [
      'Hidden topics reduce similar recommendations.',
      'Remove a topic to re-enable related suggestions.',
      'Use this frequently to train feed quality.',
    ],
    backTo: '/settings/content-preferences/not-interested',
  },
  'not-interested-accounts': {
    title: 'Accounts you have hidden',
    description: 'Review accounts you have muted from recommendation surfaces.',
    bullets: [
      'Hidden accounts appear less in suggested content.',
      'You can unhide accounts from this section.',
      'Blocking and restricting remain separate controls.',
    ],
    backTo: '/settings/content-preferences/not-interested',
  },
  'account-history-detail': {
    title: 'Account history details',
    description: 'Account history records profile and privacy-related changes over time.',
    bullets: [
      'Each entry includes type, summary, and relative time.',
      'Use this for change tracking and security checks.',
      'If you do not recognize a change, update password immediately.',
    ],
    backTo: '/settings/your-activity/account-history',
  },
};

INFO_MAP['resources-facebook-creators'] = INFO_MAP['resources-moxe-creators'];

export default function SettingsInfoPage() {
  const { slug = '' } = useParams();
  const info = INFO_MAP[slug];

  if (!info) {
    return (
      <SettingsPageShell title="Information" backTo="/settings">
        <div className="px-4 py-4">
          <p className="text-[#a8a8a8] text-sm">This information page is not available.</p>
          <Link to="/settings" className="inline-block mt-4 text-[#0095f6] text-sm font-medium">
            Back to settings
          </Link>
        </div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell title={info.title} backTo={info.backTo}>
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">{info.description}</p>
        <ul className="space-y-2">
          {info.bullets.map((item) => (
            <li key={item} className="text-white text-sm leading-6">
              - {item}
            </li>
          ))}
        </ul>
      </div>
    </SettingsPageShell>
  );
}
