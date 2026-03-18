import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

const OFF_ON = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];
const OFF_FOLLOWING_EVERYONE = [
  { label: 'Off', value: 'off' },
  { label: 'From profiles I follow', value: 'from_following' },
  { label: 'From everyone', value: 'from_everyone' },
];

export default function PostsStoriesCommentsSettings() {
  const [addedToPost, setAddedToPost] = useState('on');
  const [collaborationInvitations, setCollaborationInvitations] = useState('on');
  const [aiGeneratedPosts, setAiGeneratedPosts] = useState('on');
  const [storyComments, setStoryComments] = useState('from_everyone');
  const [addToPostSubmissions, setAddToPostSubmissions] = useState('on');
  const [photosOfYou, setPhotosOfYou] = useState('from_everyone');
  const [comments, setComments] = useState('from_everyone');
  const [commentLikesAndPins, setCommentLikesAndPins] = useState('on');

  return (
    <SettingsPageShell title="Posts, stories and comments" backTo="/settings/notifications">
      <SettingsRadioSection name="added-to-post" title="Added to post" value={addedToPost} onChange={setAddedToPost} options={OFF_ON} exampleText="johnappleseed added your photo to their post." />
      <SettingsRadioSection name="collab" title="Collaboration invitations" value={collaborationInvitations} onChange={setCollaborationInvitations} options={[...OFF_ON.slice(0, 1), { label: 'From profiles I follow', value: 'from_following' }, { label: 'On', value: 'on' }]} exampleText="johnappleseed invited you to collaborate on a post." />
      <SettingsRadioSection name="ai" title="AI-generated posts" value={aiGeneratedPosts} onChange={setAiGeneratedPosts} options={OFF_ON} exampleText="johnappleseed has new posts for you to review." />
      <SettingsRadioSection name="story-comments" title="Story comments" value={storyComments} onChange={setStoryComments} options={OFF_FOLLOWING_EVERYONE} exampleText="johnappleseed commented: Nice shot!" />
      <SettingsRadioSection name="add-to-post" title="Add to post submissions" value={addToPostSubmissions} onChange={setAddToPostSubmissions} options={OFF_ON} exampleText="johnappleseed and 3 others want to add to your post. Review their submissions." />
      <SettingsRadioSection name="photos-of-you" title="Photos of you" value={photosOfYou} onChange={setPhotosOfYou} options={OFF_FOLLOWING_EVERYONE} exampleText="johnappleseed tagged you in a photo." />
      <SettingsRadioSection name="comments" title="Comments" value={comments} onChange={setComments} options={OFF_FOLLOWING_EVERYONE} exampleText='johnappleseed commented: "Nice shot!"' />
      <SettingsRadioSection name="comment-likes" title="Comment likes and pins" value={commentLikesAndPins} onChange={setCommentLikesAndPins} options={OFF_ON} />
    </SettingsPageShell>
  );
}
