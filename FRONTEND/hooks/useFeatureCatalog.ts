import { useAccountType } from './useAccountCapabilities';
import { COMMON_BASIC_FEATURES, ACCOUNT_FEATURE_GROUPS } from '../constants/accountFeatures';

export function useFeatureCatalog() {
  const rawType = useAccountType() || 'PERSONAL';
  const type = rawType.toUpperCase() as keyof typeof ACCOUNT_FEATURE_GROUPS;
  const accountFeatures = ACCOUNT_FEATURE_GROUPS[type] ?? [];

  return {
    accountType: type,
    basic: COMMON_BASIC_FEATURES,
    accountSpecific: accountFeatures,
  };
}

