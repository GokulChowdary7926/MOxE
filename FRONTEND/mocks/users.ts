export type MockUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  isVerified?: boolean;
  accountType?: 'PERSONAL' | 'CREATOR' | 'BUSINESS' | 'JOB';
};

export const mockUsers: MockUser[] = [
  {
    id: 'u1',
    username: 'moxe.creator',
    displayName: 'MOxE Creator',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    bio: 'Sharing moments, maps, and more with MOxE.',
    website: 'https://moxe.example.com',
    isVerified: true,
    accountType: 'CREATOR',
  },
  {
    id: 'u2',
    username: 'urban.explorer',
    displayName: 'Urban Explorer',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-45202.jpeg',
    bio: 'City lights, late nights.',
    accountType: 'PERSONAL',
  },
  {
    id: 'u3',
    username: 'coffee.and.code',
    displayName: 'Coffee & Code',
    avatarUrl: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
    bio: 'Building products and sipping espresso.',
    accountType: 'BUSINESS',
    website: 'https://coffee.dev',
  },
  {
    id: 'u4',
    username: 'travel.with.ana',
    displayName: 'Ana Travels',
    avatarUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
    bio: 'Passport always ready.',
    accountType: 'CREATOR',
  },
  {
    id: 'u5',
    username: 'night.runner',
    displayName: 'Night Runner',
    avatarUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg',
    bio: 'Running through cities at midnight.',
    accountType: 'PERSONAL',
  },
  { id: 'u6', username: 'jordan.creates', displayName: 'Jordan', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', bio: 'Design & coffee.', accountType: 'PERSONAL' },
  { id: 'u7', username: 'alex.travels', displayName: 'Alex', avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg', bio: 'Wanderlust ✈️', accountType: 'CREATOR' },
  { id: 'u8', username: 'sam.kitchen', displayName: 'Sam\'s Kitchen', avatarUrl: 'https://images.pexels.com/photos/3769999/pexels-photo-3769999.jpeg', bio: 'Home chef | Recipe creator', accountType: 'BUSINESS' },
  { id: 'u9', username: 'morgan.fitness', displayName: 'Morgan', avatarUrl: 'https://images.pexels.com/photos/1553783/pexels-photo-1553783.jpeg', bio: 'Train hard. Eat clean.', accountType: 'PERSONAL' },
  { id: 'u10', username: 'riley.photo', displayName: 'Riley', avatarUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', bio: 'Photographer | NYC', accountType: 'CREATOR', isVerified: true },
  { id: 'u11', username: 'casey.reads', displayName: 'Casey', avatarUrl: 'https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg', bio: 'Books & rainy days.', accountType: 'PERSONAL' },
  { id: 'u12', username: 'quinn.music', displayName: 'Quinn', avatarUrl: 'https://images.pexels.com/photos/1687675/pexels-photo-1687675.jpeg', bio: 'Producer • Singer', accountType: 'CREATOR' },
  { id: 'u13', username: 'taylor.tech', displayName: 'Taylor', avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', bio: 'Building in public.', accountType: 'PERSONAL' },
  { id: 'u14', username: 'jesse.art', displayName: 'Jesse', avatarUrl: 'https://images.pexels.com/photos/2726111/pexels-photo-2726111.jpeg', bio: 'Digital artist', accountType: 'CREATOR' },
  { id: 'u15', username: 'drew.fashion', displayName: 'Drew', avatarUrl: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg', bio: 'Style & sustainability', accountType: 'PERSONAL' },
  { id: 'u16', username: 'skyler.yoga', displayName: 'Skyler', avatarUrl: 'https://images.pexels.com/photos/3770581/pexels-photo-3770581.jpeg', bio: 'Find your flow 🧘', accountType: 'CREATOR' },
  { id: 'u17', username: 'cameron.gaming', displayName: 'Cameron', avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', bio: 'Streamer | FPS', accountType: 'PERSONAL' },
  { id: 'u18', username: 'reese.bakery', displayName: 'Reese\'s Bakery', avatarUrl: 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg', bio: 'Fresh pastries daily.', accountType: 'BUSINESS' },
  { id: 'u19', username: 'avery.writes', displayName: 'Avery', avatarUrl: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg', bio: 'Writer | Poet', accountType: 'PERSONAL' },
  { id: 'u20', username: 'parker.outdoors', displayName: 'Parker', avatarUrl: 'https://images.pexels.com/photos/1368388/pexels-photo-1368388.jpeg', bio: 'Hikes & campfires', accountType: 'CREATOR' },
];

