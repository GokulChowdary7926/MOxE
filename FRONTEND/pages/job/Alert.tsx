import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type AlertScheduleParticipant = {
  id: string;
  accountId: string;
  position: number;
  isSecondary: boolean;
  account?: {
    id: string;
    displayName?: string | null;
    username?: string | null;
    contactPhone?: string | null;
  } | null;
};

type AlertSchedule = {
  id: string;
  name: string;
  timezone: string;
  rotationType: 'WEEKLY' | 'DAILY' | 'CUSTOM';
  handoffDay?: number | null;
  handoffTime: string;
  participants?: AlertScheduleParticipant[];
};

type ScheduleFormState = {
  name: string;
  timezone: string;
  rotationType: 'WEEKLY' | 'DAILY' | 'CUSTOM';
  handoffDay: string;
  handoffTime: string;
  participantAccountIds: string;
};

type RuleFormState = {
  scheduleId: string;
  name: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  conditionJson: string;
  notificationJson: string;
  escalationJson: string;
  quietHoursJson: string;
  testPayloadJson: string;
  ruleIdForTest: string;
};

export default function Alert() {
  const [schedules, setSchedules] = useState<AlertSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [testingRule, setTestingRule] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>({
    name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    rotationType: 'WEEKLY',
    handoffDay: '',
    handoffTime: '09:00',
    participantAccountIds: '',
  });

  const [ruleForm, setRuleForm] = useState<RuleFormState>({
    scheduleId: '',
    name: '',
    severity: 'CRITICAL',
    conditionJson: '{"metric":"cpu_usage","threshold":90}',
    notificationJson: '{"sms":true}',
    escalationJson: '{}',
    quietHoursJson: '{}',
    testPayloadJson: '{"value":95}',
    ruleIdForTest: '',
  });

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/alert/schedules`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load schedules');
      }
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('You must be logged in to use MOxE Alert.');
      return;
    }
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create schedules');
      return;
    }
    if (!scheduleForm.name.trim() || !scheduleForm.timezone.trim() || !scheduleForm.handoffTime.trim()) {
      return;
    }
    const ids = scheduleForm.participantAccountIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setError('At least one participant account ID is required');
      return;
    }
    setCreatingSchedule(true);
    setError(null);
    try {
      const payload: any = {
        name: scheduleForm.name.trim(),
        timezone: scheduleForm.timezone.trim(),
        rotationType: scheduleForm.rotationType,
        handoffTime: scheduleForm.handoffTime.trim(),
        participantAccountIds: ids,
      };
      if (scheduleForm.handoffDay) {
        const d = Number(scheduleForm.handoffDay);
        if (Number.isFinite(d)) payload.handoffDay = d;
      }
      const res = await fetch(`${API_BASE}/alert/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create schedule');
      }
      const created = await res.json();
      setSchedules((prev) => [...prev, created]);
      setScheduleForm((prev) => ({
        ...prev,
        name: '',
        participantAccountIds: '',
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to create schedule');
    } finally {
      setCreatingSchedule(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create rules');
      return;
    }
    if (!ruleForm.scheduleId || !ruleForm.name.trim()) return;
    setCreatingRule(true);
    setError(null);
    try {
      const parseJsonSafe = (text: string) => {
        if (!text.trim()) return undefined;
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      };
      const payload: any = {
        scheduleId: ruleForm.scheduleId,
        name: ruleForm.name.trim(),
        severity: ruleForm.severity,
        condition: parseJsonSafe(ruleForm.conditionJson) || {},
      };
      const notif = parseJsonSafe(ruleForm.notificationJson);
      if (notif) payload.notificationMethods = notif;
      const esc = parseJsonSafe(ruleForm.escalationJson);
      if (esc) payload.escalationConfig = esc;
      const qh = parseJsonSafe(ruleForm.quietHoursJson);
      if (qh) payload.quietHoursConfig = qh;

      const res = await fetch(`${API_BASE}/alert/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create rule');
      }
      const created = await res.json();
      setLastTestResult(`Rule created with id ${created.id}`);
      setRuleForm((prev) => ({
        ...prev,
        name: '',
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to create rule');
    } finally {
      setCreatingRule(false);
    }
  };

  const handleTestRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to test rules');
      return;
    }
    if (!ruleForm.ruleIdForTest.trim()) {
      setError('Rule ID is required to run a test');
      return;
    }
    setTestingRule(true);
    setError(null);
    setLastTestResult(null);
    try {
      let payload: any = {};
      if (ruleForm.testPayloadJson.trim()) {
        try {
          payload = JSON.parse(ruleForm.testPayloadJson);
        } catch {
          // ignore parse error, send empty payload
        }
      }
      const res = await fetch(`${API_BASE}/alert/rules/${encodeURIComponent(ruleForm.ruleIdForTest.trim())}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to test rule');
      }
      const data = await res.json();
      setLastTestResult(
        `Test event created. Event ID: ${data.eventId || 'unknown'}, notified recipient: ${
          data.recipientId || 'unknown'
        }`
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to test rule');
    } finally {
      setTestingRule(false);
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Alert…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">MOxE Alert</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        Create on-call schedules and alert rules for your Job account.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreateSchedule}
        className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">New schedule</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Name
            </label>
            <input
              type="text"
              value={scheduleForm.name}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="Primary Engineering Support"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={scheduleForm.timezone}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, timezone: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="America/New_York"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Rotation type
            </label>
            <select
              value={scheduleForm.rotationType}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  rotationType: e.target.value as ScheduleFormState['rotationType'],
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="DAILY">Daily</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Handoff day (0–6, optional)
            </label>
            <input
              type="number"
              min={0}
              max={6}
              value={scheduleForm.handoffDay}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  handoffDay: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="0 = Sunday, 1 = Monday…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Handoff time (HH:mm)
            </label>
            <input
              type="time"
              value={scheduleForm.handoffTime}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  handoffTime: e.target.value,
                }))
              }
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Participant account IDs (comma-separated)
            </label>
            <input
              type="text"
              value={scheduleForm.participantAccountIds}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  participantAccountIds: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="account-id-1, account-id-2"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={creatingSchedule}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {creatingSchedule ? 'Creating…' : 'Create schedule'}
          </button>
        </div>
      </form>

      {schedules.length === 0 ? (
        <p className="text-slate-500 text-sm mb-6">
          No schedules yet. Use the form above to create your first on-call schedule.
        </p>
      ) : (
        <div className="mb-8 space-y-3">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-50">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {s.rotationType.toLowerCase()} · {s.timezone} · handoff at {s.handoffTime}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Participants:{' '}
                    {s.participants && s.participants.length > 0
                      ? s.participants
                          .map((p) => p.account?.displayName || p.account?.username || p.accountId)
                          .join(', ')
                      : 'none'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleCreateRule}
        className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            New alert rule
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Schedule
            </label>
            <select
              value={ruleForm.scheduleId}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  scheduleId: e.target.value,
                }))
              }
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
            >
              <option value="">Select schedule…</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Rule name
            </label>
            <input
              type="text"
              value={ruleForm.name}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="High CPU on production API"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Severity
            </label>
            <select
              value={ruleForm.severity}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  severity: e.target.value as RuleFormState['severity'],
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
            >
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Condition (JSON)
            </label>
            <textarea
              rows={3}
              value={ruleForm.conditionJson}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  conditionJson: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Notification methods (JSON, optional)
            </label>
            <textarea
              rows={3}
              value={ruleForm.notificationJson}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  notificationJson: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
              placeholder='{"sms":true}'
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Escalation config (JSON, optional)
            </label>
            <textarea
              rows={3}
              value={ruleForm.escalationJson}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  escalationJson: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Quiet hours (JSON, optional)
            </label>
            <textarea
              rows={3}
              value={ruleForm.quietHoursJson}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  quietHoursJson: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={creatingRule}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {creatingRule ? 'Creating rule…' : 'Create rule'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleTestRule}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Test an alert rule
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Rule ID
            </label>
            <input
              type="text"
              value={ruleForm.ruleIdForTest}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  ruleIdForTest: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="Paste a rule id to test"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Test payload (JSON, optional)
            </label>
            <textarea
              rows={2}
              value={ruleForm.testPayloadJson}
              onChange={(e) =>
                setRuleForm((prev) => ({
                  ...prev,
                  testPayloadJson: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Test will create an alert event and notify the current on-call participant.
          </div>
          <button
            type="submit"
            disabled={testingRule}
            className="px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {testingRule ? 'Testing…' : 'Run test'}
          </button>
        </div>
        {lastTestResult && (
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{lastTestResult}</div>
        )}
      </form>
    </div>
  );
}

