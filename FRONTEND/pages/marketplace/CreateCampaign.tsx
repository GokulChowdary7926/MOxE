import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import type { AppDispatch } from '../../store';
import { createCampaign } from '../../store/campaignSlice';

export default function CreateCampaign() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    compensation: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(createCampaign({
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget || '0'),
        compensation: parseFloat(form.compensation || '0'),
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate,
      })).unwrap();
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Create Campaign" backTo="/marketplace">
      <form onSubmit={onSubmit} className="p-4 space-y-3">
        <input
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Campaign title"
          className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
        />
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description"
          className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={form.budget}
          onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
          placeholder="Total budget (USD)"
          className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={form.compensation}
          onChange={(e) => setForm((p) => ({ ...p, compensation: e.target.value }))}
          placeholder="Compensation per creator (USD)"
          className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
        />
        <input
          required
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          placeholder="Category (fashion, tech, food...)"
          className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
          />
          <input
            required
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            className="w-full rounded-lg border border-moxe-border bg-moxe-surface text-moxe-text p-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-moxe-primary text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </PageLayout>
  );
}
