import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Reply, Plus } from 'lucide-react';

export default function SavedRepliesPage() {
  return (
    <SettingsPageShell title="Saved replies" backTo="/settings/messages" right={<Link to="/messages/saved-replies/new" className="p-1 text-white" aria-label="New saved reply"><Plus className="w-5 h-5" /></Link>}>
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center mb-4">
          <Reply className="w-10 h-10 text-[#a8a8a8]" />
        </div>
        <h2 className="text-white font-bold text-xl text-center mb-2">Respond instantly</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-6">You can now save responses to the questions that you receive most often.</p>
        <Link to="/messages/saved-replies/new" className="text-[#0095f6] font-semibold text-sm">New saved reply</Link>
      </div>
    </SettingsPageShell>
  );
}
