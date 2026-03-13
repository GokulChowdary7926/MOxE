import { mockUsers } from './users';

export type MockReel = {
  id: string;
  authorId: string;
  videoUrl: string;
  caption: string;
  audioTitle: string;
  audioArtist: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
};

export const mockReels: MockReel[] = [
  {
    id: 'r1',
    authorId: mockUsers[0].id,
    videoUrl: 'https://videos.pexels.com/video1.mp4',
    caption: 'Moments from today’s build. 🚀',
    audioTitle: 'Midnight Coding',
    audioArtist: 'MOxE Sounds',
    likeCount: 2200,
    commentCount: 145,
    shareCount: 80,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    authorId: mockUsers[1].id,
    videoUrl: 'https://videos.pexels.com/video2.mp4',
    caption: 'Running through the city lights.',
    audioTitle: 'Neon Nights',
    audioArtist: 'Citywave',
    likeCount: 1340,
    commentCount: 67,
    shareCount: 34,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r3',
    authorId: mockUsers[2].id,
    videoUrl: 'https://videos.pexels.com/video3.mp4',
    caption: 'Fresh beans, fresh ideas.',
    audioTitle: 'Coffee Shop Jazz',
    audioArtist: 'Lo‑Fi Cafe',
    likeCount: 980,
    commentCount: 30,
    shareCount: 15,
    createdAt: new Date().toISOString(),
  },
];

