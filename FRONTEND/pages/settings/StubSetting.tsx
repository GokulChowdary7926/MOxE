import React from 'react';
import ComingSoon from '../../components/ComingSoon';

interface Props {
  title: string;
  backTo?: string;
  /** Optional description for the coming soon message */
  description?: string;
}

/**
 * Placeholder for settings and app features that are not yet built.
 * Renders a consistent "Coming soon" page with back navigation.
 */
export default function StubSetting({ title, backTo = '/settings', description }: Props) {
  return <ComingSoon title={title} backTo={backTo} description={description} />;
}
