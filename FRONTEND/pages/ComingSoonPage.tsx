import React from 'react';
import { useParams } from 'react-router-dom';
import ComingSoon from '../components/ComingSoon';

/**
 * Standalone "Coming soon" page. Optional title in route: /coming-soon or /coming-soon/:feature.
 */
export default function ComingSoonPage() {
  const { feature } = useParams<{ feature?: string }>();
  const title = feature ? decodeURIComponent(feature).replace(/-/g, ' ') : 'This feature';
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);
  return <ComingSoon title={displayTitle} backTo="/" description="We're working on this. Check back later." />;
}
