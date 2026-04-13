import React, { useEffect, useRef, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';

const API_BASE = getApiBase();

type AIMsgRole = 'user' | 'assistant' | 'system';

type AIMessage = {
  id: string;
  role: AIMsgRole;
  content: string;
  createdAt: string;
};

type AIChatResponse = {
  message: {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: string;
  };
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Ai() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string>('gpt-4');

  const headers = useAuthHeaders();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const loadHistory = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/ai/history?limit=50`, { headers });
      if (!res.ok) throw new Error('Failed to load AI history');
      const data = (await res.json()) as AIMessage[];
      // history is returned newest first; show in chronological order
      const ordered = [...(data || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(ordered);
      setTimeout(scrollToBottom, 50);
    } catch (e: any) {
      setError(e.message || 'Failed to load AI history');
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);

    const tempUserMessage: AIMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setInput('');
    setLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`${API_BASE}/job/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: trimmed,
          model,
          metadata: { source: 'job-ai-ui' },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'AI request failed');
      }
      const data = (await res.json()) as AIChatResponse;
      const assistantMsg: AIMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        createdAt: data.message.createdAt,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(scrollToBottom, 50);
    } catch (e: any) {
      setError(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMessage = (m: AIMessage) => {
    const isUser = m.role === 'user';
    const isAssistant = m.role === 'assistant';
    return (
      <div
        key={m.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div
          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
            isUser
              ? 'bg-[#0052CC] dark:bg-[#2684FF] text-white rounded-br-sm'
              : isAssistant
              ? 'bg-[#F4F5F7] dark:bg-[#2C333A] text-[#172B4D] dark:text-[#E6EDF3] rounded-bl-sm'
              : 'bg-[#F4F5F7] dark:bg-[#2C333A] text-[#172B4D] dark:text-[#E6EDF3]'
          }`}
        >
          {!isUser && (
            <div className="text-[11px] font-medium mb-0.5 text-[#5E6C84] dark:text-[#8C9BAB]">
              {isAssistant ? 'MOxE AI' : 'System'}
            </div>
          )}
          <div className="text-[13px] leading-snug">{m.content}</div>
          <div className="mt-1 text-[10px] text-[#5E6C84] dark:text-[#8C9BAB]">
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE AI" toolIconMaterial="psychology">
      <div className="flex flex-col gap-4">
        <JobCard variant="track">
          <div className="space-y-2">
            <label className={JOB_MOBILE.label}>Model</label>
            <select className={JOB_MOBILE.input} value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4">GPT‑4 (default)</option>
              <option value="claude-3">Claude 3</option>
              <option value="local">Local / internal</option>
            </select>
            <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">Model used for generating responses.</p>
            <button type="button" onClick={loadHistory} className={JOB_MOBILE.btnSecondary}>Refresh history</button>
          </div>
        </JobCard>

        <JobCard
          variant="track"
          flush
          className="flex flex-col min-h-[280px] max-h-[min(520px,70vh)] overflow-hidden"
        >
          <div className="flex-1 min-h-[200px] overflow-y-auto px-4 py-3">
            {messages.length === 0 && !loading && (
              <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                Ask a question about your Job projects, pipelines, code, or workflows. Try: “How do I create a job posting?” or “Summarize my Track board.”
              </p>
            )}
            {messages.map((m) => renderMessage(m))}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={send}
            className="border-t border-[#2C333A] px-3 py-2 flex items-end gap-2 bg-[#131315]"
          >
            <textarea
              className={`flex-1 resize-none ${JOB_MOBILE.input} max-h-32`}
              placeholder="Ask MOxE AI a question about your Job account, projects, or code…"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={loading || !input.trim()} className={`shrink-0 ${JOB_MOBILE.btnPrimary} w-auto min-w-[88px]`}>
              {loading ? 'Thinking…' : 'Send'}
            </button>
          </form>
        </JobCard>

        <JobBibleReferenceSection toolKey="ai" />
      </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

