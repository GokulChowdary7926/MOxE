import React from 'react';
import { useHasAds } from '../../hooks/useCapabilities';

interface AdInjectorProps {
  children: React.ReactNode;
  /** Optional ad slot component to render when user has ads */
  adSlot?: React.ReactNode;
}

/**
 * Wraps content and conditionally injects ads based on subscription.
 * Paid tiers (no ads): only children. Free: children + optional ad slot.
 */
const AdInjector: React.FC<AdInjectorProps> = ({ children, adSlot }) => {
  const hasAds = useHasAds();

  if (!hasAds) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {adSlot ?? null}
    </>
  );
};

export default AdInjector;
