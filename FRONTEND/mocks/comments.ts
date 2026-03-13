import { mockUsers } from './users';

export type MockComment = {
  id: string;
  postId: string;
  accountId: string;
  username: string;
  profilePhoto?: string | null;
  content: string;
  createdAt: string;
  likeCount?: number;
  parentId?: string | null;
};

/** Generate comments for a given post; used in Post Detail and FeedPost. */
export function getMockCommentsForPost(postId: string): MockComment[] {
  const actors = mockUsers.slice(0, 4);
  const templates = [
    'Love this! 🔥',
    'So good!',
    'Where was this taken?',
    'Amazing shot.',
    'Need to try this.',
  ];
  return templates.slice(0, 3).map((content, i) => ({
    id: `c-${postId}-${i}`,
    postId,
    accountId: actors[i % actors.length].id,
    username: actors[i % actors.length].username,
    profilePhoto: actors[i % actors.length].avatarUrl,
    content,
    createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    likeCount: Math.floor(Math.random() * 20),
  }));
}
