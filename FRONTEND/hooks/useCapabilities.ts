/**
 * Hooks for subscription capabilities (from Redux account.capabilities).
 * Use these for feature gates and UI.
 */

import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { AccountCapabilities } from '../constants/accountTypes';

export function useCapabilities(): AccountCapabilities | null {
  const capabilities = useSelector((s: RootState) => s.account.capabilities);
  return capabilities ?? null;
}

export function useHasBlueBadge(): boolean {
  const cap = useCapabilities();
  return cap?.hasBlueBadge ?? false;
}

export function useHasPurpleBadge(): boolean {
  const cap = useCapabilities();
  return cap?.hasPurpleBadge ?? false;
}

export function useHasAds(): boolean {
  const cap = useCapabilities();
  return cap?.hasAds ?? true;
}

export function useCanViewProfileVisitors(): boolean {
  const cap = useCapabilities();
  return cap?.canViewProfileVisitors ?? false;
}

export function useAnonymousStoryViewsPerDay(): number {
  const cap = useCapabilities();
  return cap?.anonymousStoryViewsPerDay ?? 0;
}

export function useCanSendToBlockedUsers(): number {
  const cap = useCapabilities();
  return cap?.canSendToBlockedUsers ?? 0;
}

export function useHasDownloadProtection(): boolean {
  const cap = useCapabilities();
  return cap?.hasDownloadProtection ?? false;
}

export function useVoiceCommandLevel(): 'none' | 'basic' | 'advanced' {
  const cap = useCapabilities();
  return (cap?.hasVoiceCommands as 'none' | 'basic' | 'advanced') ?? 'none';
}

export function useCanSchedulePosts(): boolean {
  const cap = useCapabilities();
  return cap?.canSchedulePosts ?? false;
}

export function useHasTrendingAudio(): boolean {
  const cap = useCapabilities();
  return cap?.hasTrendingAudio ?? false;
}

export function useHasContentIdeas(): boolean {
  const cap = useCapabilities();
  return cap?.hasContentIdeas ?? false;
}

export function useHasContentCalendar(): boolean {
  const cap = useCapabilities();
  return cap?.hasContentCalendar ?? false;
}

export function useCanRunAds(): boolean {
  const cap = useCapabilities();
  return cap?.canRunAds ?? false;
}

export function useMaxProducts(): number {
  const cap = useCapabilities();
  return cap?.maxProducts ?? 0;
}

export function useHasLiveShopping(): boolean {
  const cap = useCapabilities();
  return cap?.hasLiveShopping ?? false;
}

export function useHasTeamManagement(): boolean {
  const cap = useCapabilities();
  return cap?.hasTeamManagement ?? false;
}

export function useCanUseSubscriptions(): boolean {
  const cap = useCapabilities();
  return cap?.canUseSubscriptions ?? false;
}

export function useCanUseBadges(): boolean {
  const cap = useCapabilities();
  return cap?.canUseBadges ?? false;
}

export function useCanUseGifts(): boolean {
  const cap = useCapabilities();
  return cap?.canUseGifts ?? false;
}

export function useCanUseBrandedContent(): boolean {
  const cap = useCapabilities();
  return cap?.canUseBrandedContent ?? false;
}

export function useHasBrandMarketplace(): boolean {
  const cap = useCapabilities();
  return cap?.hasBrandMarketplace ?? false;
}

export function useHasJobTools(): boolean {
  const cap = useCapabilities();
  return cap?.hasJobTools ?? false;
}

export function useProfessionalTools(): string[] {
  const cap = useCapabilities();
  return cap?.professionalTools ?? [];
}

export function useSupportPriority(): 'standard' | 'priority' | 'emergency' {
  const cap = useCapabilities();
  return (cap?.supportPriority as 'standard' | 'priority' | 'emergency') ?? 'standard';
}

export function useSupportResponseTime(): string {
  const cap = useCapabilities();
  return cap?.supportResponseTime ?? '48h';
}

export function useCloudStorageGB(): number {
  const cap = useCapabilities();
  return cap?.cloudStorageGB ?? 1;
}

export function useNearbyMessagingFreePosts(): number {
  const cap = useCapabilities();
  return cap?.nearbyMessagingFreePosts ?? 1;
}

export function useNearbyMessagingFreeMessages(): number {
  const cap = useCapabilities();
  return cap?.nearbyMessagingFreeMessages ?? 10;
}

export function useNearbyMessagingExtraCost(): number {
  const cap = useCapabilities();
  return cap?.nearbyMessagingExtraCost ?? 0.5;
}
