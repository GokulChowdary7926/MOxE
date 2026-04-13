import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const OFF_ON = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];
const OFF_FOLLOWING_EVERYONE = [
  { label: 'Off', value: 'off' },
  { label: 'From profiles I follow', value: 'from_following' },
  { label: 'From everyone', value: 'from_everyone' },
];

const DEFAULTS = {
  addedToPost: 'on',
  collaborationInvitations: 'on',
  aiGeneratedPosts: 'on',
  storyComments: 'from_everyone',
  addToPostSubmissions: 'on',
  photosOfYou: 'from_everyone',
  comments: 'from_everyone',
  commentLikesAndPins: 'on',
} as const;

export default function PostsStoriesCommentsSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'postsStoriesComments',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="Posts, stories and comments" backTo="/settings/notifications">
      {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
      {!ready && <p className="text-[#737373] text-sm px-4 py-3">Loading…</p>}
      <SettingsRadioSection
        name="added-to-post"
        title="Added to post"
        value={values.addedToPost}
        onChange={(v) => setField('addedToPost', v)}
        options={OFF_ON}
        exampleText="johnappleseed added your photo to their post."
      />
      <SettingsRadioSection
        name="collab"
        title="Collaboration invitations"
        value={values.collaborationInvitations}
        onChange={(v) => setField('collaborationInvitations', v)}
        options={[...OFF_ON.slice(0, 1), { label: 'From profiles I follow', value: 'from_following' }, { label: 'On', value: 'on' }]}
        exampleText="johnappleseed invited you to collaborate on a post."
      />
      <SettingsRadioSection
        name="ai"
        title="AI-generated posts"
        value={values.aiGeneratedPosts}
        onChange={(v) => setField('aiGeneratedPosts', v)}
        options={OFF_ON}
        exampleText="johnappleseed has new posts for you to review."
      />
      <SettingsRadioSection
        name="story-comments"
        title="Story comments"
        value={values.storyComments}
        onChange={(v) => setField('storyComments', v)}
        options={OFF_FOLLOWING_EVERYONE}
        exampleText="johnappleseed commented: Nice shot!"
      />
      <SettingsRadioSection
        name="add-to-post"
        title="Add to post submissions"
        value={values.addToPostSubmissions}
        onChange={(v) => setField('addToPostSubmissions', v)}
        options={OFF_ON}
        exampleText="johnappleseed and 3 others want to add to your post. Review their submissions."
      />
      <SettingsRadioSection
        name="photos-of-you"
        title="Photos of you"
        value={values.photosOfYou}
        onChange={(v) => setField('photosOfYou', v)}
        options={OFF_FOLLOWING_EVERYONE}
        exampleText="johnappleseed tagged you in a photo."
      />
      <SettingsRadioSection
        name="comments"
        title="Comments"
        value={values.comments}
        onChange={(v) => setField('comments', v)}
        options={OFF_FOLLOWING_EVERYONE}
        exampleText='johnappleseed commented: "Nice shot!"'
      />
      <SettingsRadioSection
        name="comment-likes"
        title="Comment likes and pins"
        value={values.commentLikesAndPins}
        onChange={(v) => setField('commentLikesAndPins', v)}
        options={OFF_ON}
      />
    </SettingsPageShell>
  );
}
