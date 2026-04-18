import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ThemedText, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

export default function HiddenWordsSettings() {
  const [hiddenWords, setHiddenWords] = useState('');
  const [hiddenRegexText, setHiddenRegexText] = useState('');
  const [hiddenAllowList, setHiddenAllowList] = useState('');
  const [hiddenCommentFilter, setHiddenCommentFilter] = useState(true);
  const [hiddenDmFilter, setHiddenDmFilter] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const applyCfg = useCallback((cfg: unknown) => {
    if (!cfg || typeof cfg !== 'object') return;
    const o = cfg as Record<string, unknown>;
    const w = Array.isArray(o.words) ? o.words : [];
    const rx = Array.isArray(o.regexPatterns) ? o.regexPatterns : [];
    const al = Array.isArray(o.allowListAccountIds) ? o.allowListAccountIds : [];
    setHiddenWords(w.filter((x: unknown): x is string => typeof x === 'string').join(', '));
    setHiddenRegexText(rx.filter((x: unknown): x is string => typeof x === 'string').join('\n'));
    setHiddenAllowList(al.filter((x: unknown): x is string => typeof x === 'string').join(', '));
    setHiddenCommentFilter(!!o.commentFilterEnabled);
    setHiddenDmFilter(!!o.dmFilterEnabled);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Sign in to edit hidden words.');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/privacy/hidden-words`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cfg = await res.json().catch(() => null);
        if (!res.ok || cancelled || !cfg || typeof cfg !== 'object') {
          if (!cancelled) setError('Could not load hidden words.');
          return;
        }
        applyCfg(cfg);
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError('Could not load hidden words.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [applyCfg]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const words = hiddenWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      const regexPatterns = hiddenRegexText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const allowListAccountIds = hiddenAllowList
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const res = await fetch(`${API_BASE}/privacy/hidden-words`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words,
          regexPatterns,
          allowListAccountIds,
          commentFilterEnabled: hiddenCommentFilter,
          dmFilterEnabled: hiddenDmFilter,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof (data as any).error === 'string' ? (data as any).error : 'Could not save.');
        return;
      }
    } catch {
      setError('Could not save hidden words.');
    } finally {
      setSaving(false);
    }
  }

  async function exportList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/privacy/hidden-words/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not export.',
        );
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moxe-hidden-words-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not export.');
    } finally {
      setExporting(false);
    }
  }

  async function onImportFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setImporting(true);
    setError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        setError('Import file is not valid JSON.');
        return;
      }
      const o = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
      const words = Array.isArray(o?.words)
        ? o.words.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const regexPatterns = Array.isArray(o?.regexPatterns)
        ? o.regexPatterns.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const res = await fetch(`${API_BASE}/privacy/hidden-words/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words, regexPatterns }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not import.',
        );
        return;
      }
      applyCfg(data);
    } catch {
      setError('Could not import.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <SettingsPageShell title="Hidden words" backTo="/settings">
      <div className="px-4 py-4 space-y-4">
        <ThemedText secondary className="text-sm">
          Comments, DM requests, story interactions, and notes can be filtered using these rules. For block lists and a
          full activity log, open the{' '}
          <Link to="/settings/safety-center" className="text-moxe-primary font-medium">
            Safety center
          </Link>
          .
        </ThemedText>
        <Link to="/settings/info/help-hidden-words" className="text-moxe-primary text-sm font-medium">
          Learn more
        </Link>

        {loading && (
          <ThemedText secondary className="text-sm">
            Loading…
          </ThemedText>
        )}
        {error && (
          <ThemedText className="text-sm text-moxe-danger">{error}</ThemedText>
        )}

        <form onSubmit={save} className="space-y-3">
          <ThemedInput
            value={hiddenWords}
            onChange={(e) => setHiddenWords(e.target.value)}
            placeholder="Words or phrases, comma-separated"
            disabled={loading}
          />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-moxe-textSecondary">
              <input
                type="checkbox"
                checked={hiddenCommentFilter}
                onChange={(e) => setHiddenCommentFilter(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-moxe-border"
              />
              Filter comments on my posts
            </label>
            <label className="flex items-center gap-2 text-xs text-moxe-textSecondary">
              <input
                type="checkbox"
                checked={hiddenDmFilter}
                onChange={(e) => setHiddenDmFilter(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-moxe-border"
              />
              Filter DM requests to me
            </label>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-moxe-primary text-xs font-medium"
          >
            {showAdvanced ? 'Hide advanced' : 'Advanced (regex, allow-list)'}
          </button>
          {showAdvanced && (
            <div className="space-y-2 border-t border-moxe-border pt-3">
              <ThemedText secondary className="text-xs">
                One regex pattern per line. Invalid patterns are rejected when you save.
              </ThemedText>
              <textarea
                value={hiddenRegexText}
                onChange={(e) => setHiddenRegexText(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder={'e.g. buy\\s+now'}
                className="w-full bg-moxe-surface border border-moxe-border rounded-moxe-md px-3 py-2 text-moxe-text text-sm placeholder:text-moxe-textSecondary font-mono"
              />
              <ThemedText secondary className="text-xs">
                Allow-list: account IDs, comma-separated.
              </ThemedText>
              <ThemedInput
                value={hiddenAllowList}
                onChange={(e) => setHiddenAllowList(e.target.value)}
                placeholder="Account IDs…"
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <ThemedButton
              type="button"
              variant="secondary"
              label={exporting ? 'Exporting…' : 'Export list'}
              className="flex-1 min-w-[7rem] justify-center"
              disabled={loading || saving || exporting || importing}
              onClick={() => void exportList()}
            />
            <ThemedButton
              type="button"
              variant="secondary"
              label={importing ? 'Importing…' : 'Import list'}
              className="flex-1 min-w-[7rem] justify-center"
              disabled={loading || saving || exporting || importing}
              onClick={() => importFileRef.current?.click()}
            />
        <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-hidden
              onChange={(e) => void onImportFile(e)}
            />
          </div>
          <ThemedText secondary className="text-[10px]">
            Import merges words and regex from the file with your current list.
          </ThemedText>
          <ThemedButton
            type="submit"
            label={saving ? 'Saving…' : 'Save'}
            className="w-full justify-center"
            disabled={loading || saving}
          />
        </form>
      </div>
    </SettingsPageShell>
  );
}
