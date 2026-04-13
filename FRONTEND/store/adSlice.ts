import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getApiBase, getToken } from '../services/api';

export type ServedAd = {
  id: string;
  type: 'ad';
  campaignId: string;
  post: {
    id: string;
    caption?: string | null;
    media?: any;
    location?: string | null;
    createdAt?: string;
    likeCount?: number;
    commentCount?: number;
    productTags?: any[];
  };
  business: {
    id: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
    verifiedBadge?: boolean;
  };
  destinationUrl?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
};

type AdsState = {
  servedAd: ServedAd | null;
  loading: boolean;
  error: string | null;
};

const initialState: AdsState = {
  servedAd: null,
  loading: false,
  error: null,
};

export const fetchServedAd = createAsyncThunk<ServedAd | null, void>(
  'ads/fetchServedAd',
  async () => {
    const token = getToken();
    if (!token) throw new Error('Not logged in');
    const res = await fetch(`${getApiBase()}/ads/serve`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    // Empty inventory is normal — not an error for UI or Redux error state.
    if ((data as any)?.ad === null) return null;
    if (res.status === 404) return null;
    if (!res.ok) throw new Error((data as any).error || 'Failed to load ad');
    return data as ServedAd;
  },
);

export const trackAdImpression = createAsyncThunk(
  'ads/trackImpression',
  async (campaignId: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${getApiBase()}/ads/track-impression`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignId }),
    });
  }
);

export const trackAdClick = createAsyncThunk('ads/trackClick', async (campaignId: string) => {
  const token = getToken();
  if (!token) return;
  await fetch(`${getApiBase()}/ads/track-click`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaignId }),
  });
});

const adSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    clearServedAd: (state) => {
      state.servedAd = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServedAd.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServedAd.fulfilled, (state, action) => {
        state.loading = false;
        state.servedAd = action.payload ?? null;
        state.error = null;
      })
      .addCase(fetchServedAd.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ad';
      });
  },
});

export const { clearServedAd } = adSlice.actions;
export default adSlice.reducer;
