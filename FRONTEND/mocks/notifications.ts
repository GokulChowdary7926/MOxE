import { mockUsers } from './users';

export type MockNotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'story_reaction';

export type MockNotification = {
  id: string;
  type: MockNotificationType;
  actorId: string;
  targetPostId?: string;
  message: string;
  createdAt: string;
};

export const mockNotifications: MockNotification[] = [
  {
    id: 'n1',
    type: 'like',
    actorId: mockUsers[1].id,
    targetPostId: 'p1',
    message: `${mockUsers[1].username} liked your photo.`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'comment',
    actorId: mockUsers[2].id,
    targetPostId: 'p2',
    message: `${mockUsers[2].username} commented: “This looks amazing!”`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n3',
    type: 'follow',
    actorId: mockUsers[3].id,
    message: `${mockUsers[3].username} started following you.`,
    createdAt: new Date().toISOString(),
  },
];

