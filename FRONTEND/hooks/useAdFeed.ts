import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchServedAd, trackAdImpression } from '../store/adSlice';
import { getMediaUrls } from '../utils/mediaEntries';

type BaseFeedItem = {
  id: string;
  authorAccountId?: string;
  author: { username: string; displayName?: string | null; avatarUri?: string | null };
  mediaUrls: string[];
  caption?: string | null;
  locationName?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  isLiked: boolean;
  isSaved: boolean;
  screenshotProtection?: boolean;
  adCampaignId?: string;
  sponsorAccountId?: string;
  adDestinationUrl?: string | null;
  allowComments?: boolean;
  hideLikeCount?: boolean;
  adUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
};

export function useAdFeed(items: BaseFeedItem[], enabled: boolean) {
  const dispatch = useDispatch<AppDispatch>();
  const impressionSentRef = useRef<string | null>(null);
  const fetchedOnceRef = useRef(false);
  const servedAdRef = useRef<BaseFeedItem | null>(null);

  useEffect(() => {
    if (!enabled || fetchedOnceRef.current) return;
    const hasSponsored = items.some((i) => !!i.adCampaignId);
    if (hasSponsored) return;
    fetchedOnceRef.current = true;
    dispatch(fetchServedAd())
      .unwrap()
      .then((ad) => {
        if (!ad) {
          servedAdRef.current = null;
          return;
        }
        servedAdRef.current = {
          id: ad.post.id,
          authorAccountId: ad.business.id,
          author: {
            username: ad.business.username,
            displayName: ad.business.displayName ?? null,
            avatarUri: ad.business.avatar ?? null,
          },
          mediaUrls:
            Array.isArray(ad.post.media) && ad.post.media.length
              ? getMediaUrls(ad.post.media)
              : [''],
          caption: ad.post.caption ?? null,
          locationName: ad.post.location ?? null,
          likeCount: ad.post.likeCount ?? 0,
          commentCount: ad.post.commentCount ?? 0,
          shareCount: 0,
          isLiked: false,
          isSaved: false,
          adCampaignId: ad.campaignId,
          sponsorAccountId: ad.business.id,
          adDestinationUrl: ad.destinationUrl ?? null,
          adUtm: ad.utm ?? undefined,
          allowComments: (ad.post as { allowComments?: boolean } | undefined)?.allowComments !== false,
          hideLikeCount: !!(ad.post as { hideLikeCount?: boolean } | undefined)?.hideLikeCount,
        };
      })
      .catch(() => {
        servedAdRef.current = null;
      });
  }, [dispatch, enabled, items]);

  const itemsWithAds = useMemo(() => {
    if (!enabled) return items;
    if (items.some((i) => !!i.adCampaignId)) return items;
    const adItem = servedAdRef.current;
    if (!adItem) return items;
    const index = items.length > 5 ? 5 : items.length;
    const merged = [...items];
    merged.splice(index, 0, adItem);
    if (adItem.adCampaignId && impressionSentRef.current !== adItem.adCampaignId) {
      impressionSentRef.current = adItem.adCampaignId;
      dispatch(trackAdImpression(adItem.adCampaignId));
    }
    return merged;
  }, [dispatch, enabled, items]);

  return { itemsWithAds };
}
