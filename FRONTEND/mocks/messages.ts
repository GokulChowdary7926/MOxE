import { mockUsers } from './users';

export type MockMessage = {
  id: string;
  threadId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'share';
  content: string;
  createdAt: string;
};

export type MockThread = {
  id: string;
  userId: string;
  otherUserId: string;
  lastMessage: string;
  unreadCount: number;
  isMuted?: boolean;
  isPinned?: boolean;
  updatedAt: string;
};

export const mockThreads: MockThread[] = [
  {
    id: 't1',
    userId: mockUsers[0].id,
    otherUserId: mockUsers[1].id,
    lastMessage: 'Let’s meet near the map pin you sent.',
    unreadCount: 2,
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    userId: mockUsers[0].id,
    otherUserId: mockUsers[2].id,
    lastMessage: 'Love the new coffee setup ☕️',
    unreadCount: 0,
    isMuted: true,
    updatedAt: new Date().toISOString(),
  },
];

export const mockMessages: MockMessage[] = [
  {
    id: 'm1',
    threadId: 't1',
    senderId: mockUsers[0].id,
    type: 'text',
    content: 'Did you see the new MOxE map view?',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    threadId: 't1',
    senderId: mockUsers[1].id,
    type: 'text',
    content: 'Yes! Looks very clean, love the SOS button.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3',
    threadId: 't2',
    senderId: mockUsers[2].id,
    type: 'share',
    content: 'p3', // shared post id
    createdAt: new Date().toISOString(),
  },
];

