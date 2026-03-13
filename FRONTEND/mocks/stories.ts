import { mockUsers } from './users';

export type MockStory = {
  id: string;
  userId: string;
  mediaUrl: string;
  hasUnseen: boolean;
  createdAt: string;
  isLive?: boolean;
  closeFriends?: boolean;
};

/** Stories for tray: always populated so feed never looks empty */
export const mockStories: MockStory[] = [
  { id: 's1', userId: mockUsers[1].id, mediaUrl: 'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
  { id: 's2', userId: mockUsers[2].id, mediaUrl: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
  { id: 's3', userId: mockUsers[3].id, mediaUrl: 'https://images.pexels.com/photos/210307/pexels-photo-210307.jpeg', hasUnseen: false, createdAt: new Date().toISOString() },
  { id: 's4', userId: mockUsers[4].id, mediaUrl: 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg', hasUnseen: true, createdAt: new Date().toISOString(), isLive: true },
  { id: 's5', userId: mockUsers[5].id, mediaUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
  { id: 's6', userId: mockUsers[6].id, mediaUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', hasUnseen: false, createdAt: new Date().toISOString(), closeFriends: true },
  { id: 's7', userId: mockUsers[7].id, mediaUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
  { id: 's8', userId: mockUsers[8].id, mediaUrl: 'https://images.pexels.com/photos/3769999/pexels-photo-3769999.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
  { id: 's9', userId: mockUsers[9].id, mediaUrl: 'https://images.pexels.com/photos/1553783/pexels-photo-1553783.jpeg', hasUnseen: false, createdAt: new Date().toISOString() },
  { id: 's10', userId: mockUsers[10].id, mediaUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', hasUnseen: true, createdAt: new Date().toISOString() },
];

