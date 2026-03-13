import { mockUsers } from './users';

export type MockMedia = {
  url: string;
  type?: 'image' | 'video';
};

export type MockPost = {
  id: string;
  authorId: string;
  media: MockMedia[];
  caption: string;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  createdAt: string;
  location?: string;
  hashtags?: string[];
  isVideo?: boolean;
  isCarousel?: boolean;
};

const pickAuthor = (id: string) => mockUsers.find((u) => u.id === id) ?? mockUsers[0];

export const mockPosts: MockPost[] = [
  {
    id: 'p1',
    authorId: pickAuthor('u1').id,
    media: [
      { url: 'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg', type: 'image' },
      { url: 'https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg', type: 'image' },
    ],
    caption: 'Golden hour over the city. ✨ #sunset #cityscape',
    likeCount: 1289,
    commentCount: 42,
    shareCount: 1600,
    createdAt: new Date().toISOString(),
    location: 'San Francisco, California',
    hashtags: ['sunset', 'cityscape'],
    isCarousel: true,
  },
  {
    id: 'p2',
    authorId: pickAuthor('u2').id,
    media: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg', type: 'image' }],
    caption: 'Morning coffee before mapping out the day. ☕️',
    likeCount: 642,
    commentCount: 19,
    createdAt: new Date().toISOString(),
    location: 'Berlin, Germany',
    hashtags: ['coffee', 'remote'],
  },
  {
    id: 'p3',
    authorId: pickAuthor('u3').id,
    media: [{ url: 'https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg', type: 'image' }],
    caption: 'New beans in the roastery this week. Which one would you try first?',
    likeCount: 981,
    commentCount: 63,
    createdAt: new Date().toISOString(),
    location: 'Lisbon, Portugal',
    hashtags: ['coffee', 'roastery', 'moxe'],
  },
  {
    id: 'p4',
    authorId: pickAuthor('u4').id,
    media: [{ url: 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg', type: 'image' }],
    caption: 'One more from this hidden beach. 🌊',
    likeCount: 2330,
    commentCount: 101,
    createdAt: new Date().toISOString(),
    location: 'Algarve, Portugal',
    hashtags: ['travel', 'beach'],
  },
  {
    id: 'p5',
    authorId: pickAuthor('u5').id,
    media: [{ url: 'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg', type: 'image' }],
    caption: 'Night run through the lights of the city.',
    likeCount: 412,
    commentCount: 8,
    createdAt: new Date().toISOString(),
    location: 'Tokyo, Japan',
    hashtags: ['running', 'night'],
  },
  { id: 'p6', authorId: pickAuthor('u6').id, media: [{ url: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg', type: 'image' }], caption: 'New desk setup for the win.', likeCount: 892, commentCount: 34, createdAt: new Date().toISOString(), location: 'Austin, TX', hashtags: ['workspace'] },
  { id: 'p7', authorId: pickAuthor('u7').id, media: [{ url: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg', type: 'image' }], caption: 'Mountain morning 🌄', likeCount: 2103, commentCount: 87, createdAt: new Date().toISOString(), location: 'Swiss Alps', hashtags: ['travel', 'mountains'] },
  { id: 'p8', authorId: pickAuthor('u8').id, media: [{ url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg', type: 'image' }], caption: 'Sunday brunch special – avocado toast.', likeCount: 445, commentCount: 22, createdAt: new Date().toISOString(), hashtags: ['food', 'brunch'] },
  { id: 'p9', authorId: pickAuthor('u9').id, media: [{ url: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg', type: 'image' }], caption: 'Leg day done right.', likeCount: 567, commentCount: 19, createdAt: new Date().toISOString(), location: 'The Gym', hashtags: ['fitness'] },
  { id: 'p10', authorId: pickAuthor('u10').id, media: [{ url: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg', type: 'image' }], caption: 'Street light. NYC.', likeCount: 3201, commentCount: 112, createdAt: new Date().toISOString(), location: 'New York', hashtags: ['photography', 'nyc'] },
  { id: 'p11', authorId: pickAuthor('u11').id, media: [{ url: 'https://images.pexels.com/photos/159866/pexels-photo-159866.jpeg', type: 'image' }], caption: 'Current read 📖', likeCount: 234, commentCount: 11, createdAt: new Date().toISOString(), hashtags: ['books'] },
  { id: 'p12', authorId: pickAuthor('u12').id, media: [{ url: 'https://images.pexels.com/photos/164936/pexels-photo-164936.jpeg', type: 'image' }], caption: 'New track dropping soon.', likeCount: 1890, commentCount: 156, createdAt: new Date().toISOString(), hashtags: ['music'] },
];

