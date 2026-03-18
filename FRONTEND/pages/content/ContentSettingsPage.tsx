import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ContentSettingsPage() {
  const { postId, reelId, id } = useParams<{ postId?: string; reelId?: string; id?: string }>();
  const type = postId ? 'post' : reelId ? 'reel' : 'story';
  const backTo = postId ? `/post/${postId}` : reelId ? '/reels' : id ? '/stories' : '/';

  const [turnOffCommenting, setTurnOffCommenting] = React.useState(false);
  const [hideLikeCount, setHideLikeCount] = React.useState(false);

  return (
    <SettingsPageShell title={`${type.charAt(0).toUpperCase() + type.slice(1)} settings`} backTo={backTo}>
      <div className="px-4 py-4">
        <SettingsToggleRow label="Turn off commenting" checked={turnOffCommenting} onChange={setTurnOffCommenting} description="No one can comment on this content." />
        <SettingsToggleRow label="Hide like count" checked={hideLikeCount} onChange={setHideLikeCount} description="Only you can see how many likes this got." />
      </div>
    </SettingsPageShell>
  );
}
