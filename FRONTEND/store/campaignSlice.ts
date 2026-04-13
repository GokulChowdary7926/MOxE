import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBase, getToken } from '../services/api';

export type CampaignItem = {
  id: string;
  title: string;
  description?: string | null;
  budget: number;
  compensation: number;
  requirements?: any;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  brand?: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null };
  applications?: Array<{ id: string; status: string; message?: string | null }>;
};

type CampaignState = {
  list: CampaignItem[];
  current: CampaignItem | null;
  loading: boolean;
  error: string | null;
};

const initialState: CampaignState = {
  list: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchCampaigns = createAsyncThunk('campaigns/fetch', async () => {
  const res = await fetch(`${getApiBase()}/campaigns`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch campaigns');
  return data as CampaignItem[];
});

export const createCampaign = createAsyncThunk('campaigns/create', async (payload: {
  title: string;
  description?: string;
  budget: number;
  compensation: number;
  category: string;
  startDate: string;
  endDate: string;
}) => {
  const res = await fetch(`${getApiBase()}/campaigns`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create campaign');
  return data as CampaignItem;
});

export const applyToCampaign = createAsyncThunk('campaigns/apply', async (payload: { campaignId: string; message?: string }) => {
  const res = await fetch(`${getApiBase()}/campaigns/${payload.campaignId}/apply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: payload.message ?? '' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to apply');
  return { campaignId: payload.campaignId };
});

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch campaigns';
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.list = [action.payload, ...state.list];
      })
      .addCase(applyToCampaign.fulfilled, (state, action) => {
        state.list = state.list.map((c) =>
          c.id === action.payload.campaignId
            ? { ...c, applications: [{ id: 'pending-local', status: 'pending' }] }
            : c
        );
      });
  },
});

export default campaignSlice.reducer;
