import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PageLayout } from '../../components/layout/PageLayout';
import type { AppDispatch, RootState } from '../../store';
import { applyToCampaign, fetchCampaigns } from '../../store/campaignSlice';

export default function Marketplace() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, error } = useSelector((state: RootState) => state.campaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const submitApply = async (campaignId: string) => {
    await dispatch(applyToCampaign({ campaignId, message }));
    setSelectedCampaign(null);
    setMessage('');
  };

  return (
    <PageLayout title="Creator Marketplace" backTo="/creator-studio">
      <div className="p-4 space-y-4">
        <p className="text-moxe-textSecondary text-sm">
          Find brand collaborations and apply to campaigns that match your style.
        </p>
        {loading && <p className="text-moxe-textSecondary text-sm">Loading campaigns...</p>}
        {error && <p className="text-moxe-danger text-sm">{error}</p>}
        {!loading && list.length === 0 && (
          <p className="text-moxe-textSecondary text-sm">No active campaigns at the moment.</p>
        )}
        {list.map((campaign) => {
          const hasApplied = (campaign.applications?.length ?? 0) > 0;
          const appStatus = campaign.applications?.[0]?.status;
          return (
            <article key={campaign.id} className="rounded-xl border border-moxe-border bg-moxe-surface p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-moxe-text font-semibold">{campaign.title}</h3>
                  <p className="text-moxe-textSecondary text-xs">
                    by @{campaign.brand?.username ?? 'brand'}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-moxe-primary/15 text-moxe-primary">
                  {campaign.category}
                </span>
              </div>
              {campaign.description && (
                <p className="text-moxe-textSecondary text-sm">{campaign.description}</p>
              )}
              <p className="text-moxe-text text-sm">
                Compensation: ${(campaign.compensation / 100).toFixed(2)}
              </p>
              <p className="text-moxe-textSecondary text-xs">
                Ends: {new Date(campaign.endDate).toLocaleDateString()}
              </p>

              {!hasApplied ? (
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className="mt-1 px-3 py-1.5 rounded-md bg-moxe-primary text-white text-sm font-medium"
                >
                  Apply
                </button>
              ) : appStatus === 'accepted' ? (
                <p className="text-green-500 text-sm font-medium">Accepted</p>
              ) : appStatus === 'pending' ? (
                <p className="text-yellow-500 text-sm font-medium">Pending review</p>
              ) : appStatus === 'rejected' ? (
                <p className="text-red-500 text-sm font-medium">Not selected</p>
              ) : null}

              {selectedCampaign === campaign.id && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the brand why you'd be a great fit..."
                    className="w-full rounded-lg border border-moxe-border bg-moxe-background text-moxe-text p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitApply(campaign.id)}
                      className="px-3 py-1.5 rounded-md bg-moxe-primary text-white text-sm font-medium"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCampaign(null)}
                      className="px-3 py-1.5 rounded-md border border-moxe-border text-moxe-text text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </PageLayout>
  );
}
