import React, { useState } from 'react';
import { PageLayout, SettingsRadioSection } from '../../components/layout/PageLayout';

/**
 * Instagram-style "Posts, stories and comments" notification/preference screen (§9.3).
 * Sections with radio options (Off / On or From profiles I follow / From everyone) and example text.
 */
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
    <PageLayout title="Posts, stories and comments" backTo="/settings/notifications">
      <div className="py-4">
        <SettingsRadioSection
          title="Added to post"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={addedToPost}
          onChange={setAddedToPost}
          exampleText="johnappleseed added your photo to their post."
        />
        <SettingsRadioSection
          title="Collaboration invitations"
          options={[
            { label: 'Off', value: 'off' },
            { label: 'From profiles I follow', value: 'from_following' },
            { label: 'On', value: 'on' },
          ]}
          value={collaborationInvitations}
          onChange={setCollaborationInvitations}
          exampleText="johnappleseed invited you to collaborate on a post."
        />
        <SettingsRadioSection
          title="AI-generated posts"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={aiGeneratedPosts}
          onChange={setAiGeneratedPosts}
          exampleText="johnappleseed has new posts for you to review."
        />
        <SettingsRadioSection
          title="Story comments"
          options={[
            { label: 'Off', value: 'off' },
            { label: 'From profiles I follow', value: 'from_following' },
            { label: 'From everyone', value: 'from_everyone' },
          ]}
          value={storyComments}
          onChange={setStoryComments}
          exampleText="johnappleseed commented: Nice shot!"
        />
        <SettingsRadioSection
          title="Add to post submissions"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={addToPostSubmissions}
          onChange={setAddToPostSubmissions}
          exampleText="johnappleseed and 3 others want to add to your post. Review their submissions."
        />
        <SettingsRadioSection
          title="Photos of you"
          options={[
            { label: 'Off', value: 'off' },
            { label: 'From profiles I follow', value: 'from_following' },
            { label: 'From everyone', value: 'from_everyone' },
          ]}
          value={photosOfYou}
          onChange={setPhotosOfYou}
          exampleText="johnappleseed tagged you in a photo."
        />
        <SettingsRadioSection
          title="Comments"
          options={[
            { label: 'Off', value: 'off' },
            { label: 'From profiles I follow', value: 'from_following' },
            { label: 'From everyone', value: 'from_everyone' },
          ]}
          value={comments}
          onChange={setComments}
          exampleText='johnappleseed commented: "Nice shot!"'
        />
        <SettingsRadioSection
          title="Comment likes and pins"
          options={[{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }]}
          value={commentLikesAndPins}
          onChange={setCommentLikesAndPins}
        />
      </div>
    </PageLayout>
  );
}
