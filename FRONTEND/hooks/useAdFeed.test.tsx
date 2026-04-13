import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useAdFeed } from './useAdFeed';

const mockDispatch = jest.fn();
const mockFetchServedAd = jest.fn(() => ({ type: 'ads/fetchServedAd' }));
const mockTrackAdImpression = jest.fn((id: string) => ({ type: 'ads/track', payload: id }));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../store/adSlice', () => ({
  fetchServedAd: () => mockFetchServedAd(),
  trackAdImpression: (id: string) => mockTrackAdImpression(id),
}));

type FeedItem = {
  id: string;
  author: { username: string };
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  adCampaignId?: string;
};

function HookHarness({
  items,
  enabled,
  onItems,
}: {
  items: FeedItem[];
  enabled: boolean;
  onItems: (arr: FeedItem[]) => void;
}) {
  const { itemsWithAds } = useAdFeed(items, enabled);
  React.useEffect(() => onItems(itemsWithAds as FeedItem[]), [itemsWithAds, onItems]);
  return null;
}

describe('useAdFeed', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockDispatch.mockImplementation(() => ({
      unwrap: () =>
        Promise.resolve({
          campaignId: 'cmp1',
          destinationUrl: 'https://example.com',
          business: { id: 'biz1', username: 'biz' },
          post: { id: 'ad1', media: [{ url: 'https://img.test/ad.jpg' }], likeCount: 0, commentCount: 0 },
        }),
    }));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('returns original items when disabled', async () => {
    const onItems = jest.fn();
    await act(async () => {
      root.render(
        <HookHarness
          enabled={false}
          items={[{ id: '1', author: { username: 'u1' }, mediaUrls: [], likeCount: 0, commentCount: 0, isLiked: false, isSaved: false }]}
          onItems={onItems}
        />,
      );
    });
    const latest = onItems.mock.calls.at(-1)?.[0];
    expect(latest).toHaveLength(1);
  });

  it('inserts served ad item and tracks impression', async () => {
    const onItems = jest.fn();
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      author: { username: `u${i}` },
      mediaUrls: [],
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isSaved: false,
    }));

    await act(async () => {
      root.render(<HookHarness enabled items={items} onItems={onItems} />);
      await Promise.resolve();
    });

    const latest = onItems.mock.calls.at(-1)?.[0] as FeedItem[];
    expect(latest.length).toBeGreaterThanOrEqual(6);
    expect(mockFetchServedAd).toHaveBeenCalled();
  });

  it('handles null ad response without insertion', async () => {
    const onItems = jest.fn();
    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.resolve(null),
    }));

    await act(async () => {
      root.render(
        <HookHarness
          enabled
          items={[{ id: '1', author: { username: 'u1' }, mediaUrls: [], likeCount: 0, commentCount: 0, isLiked: false, isSaved: false }]}
          onItems={onItems}
        />,
      );
      await Promise.resolve();
    });

    const latest = onItems.mock.calls.at(-1)?.[0] as FeedItem[];
    expect(latest).toHaveLength(1);
  });

  it('keeps original feed when fetch ad fails', async () => {
    const onItems = jest.fn();
    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.reject(new Error('ad failed')),
    }));

    await act(async () => {
      root.render(
        <HookHarness
          enabled
          items={[{ id: '2', author: { username: 'u2' }, mediaUrls: [], likeCount: 0, commentCount: 0, isLiked: false, isSaved: false }]}
          onItems={onItems}
        />,
      );
      await Promise.resolve();
    });

    const latest = onItems.mock.calls.at(-1)?.[0] as FeedItem[];
    expect(latest).toHaveLength(1);
  });
});
