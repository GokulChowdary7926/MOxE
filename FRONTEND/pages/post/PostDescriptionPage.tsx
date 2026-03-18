import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function PostDescriptionPage() {
  const { postId } = useParams();
  const [caption, setCaption] = useState('');

  return (
    <SettingsPageShell title="Post description" backTo={postId ? `/post/${postId}` : '/profile'} right={<button type="button" className="text-[#0095f6] font-medium text-sm">Save</button>}>
      <div className="px-4 py-4">
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full min-h-[120px] p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] resize-none text-sm" />
        <p className="text-[#737373] text-xs mt-2">Add a description for your post. You can @mention people and use #hashtags.</p>
      </div>
    </SettingsPageShell>
  );
}
