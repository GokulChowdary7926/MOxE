import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function NewSavedReplyPage() {
  const navigate = useNavigate();
  const [shortcut, setShortcut] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    navigate('/messages/saved-replies');
  };

  return (
    <SettingsPageShell
      title="New saved reply"
      backTo="/messages/saved-replies"
      right={
        <button type="button" onClick={handleSave} className="text-[#0095f6] font-medium text-sm">
          Save
        </button>
      }
    >
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-[#a8a8a8] text-xs mb-1">Shortcut (e.g. /thanks)</label>
          <input
            type="text"
            value={shortcut}
            onChange={(e) => setShortcut(e.target.value)}
            placeholder="/shortcut"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <div>
          <label className="block text-[#a8a8a8] text-xs mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your saved reply…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm resize-none"
          />
        </div>
      </div>
    </SettingsPageShell>
  );
}
