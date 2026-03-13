export type MockPlace = {
  id: string;
  name: string;
  imageUrl: string;
  distanceKm: number;
  rating: number;
  category: string;
};

export const mockPlaces: MockPlace[] = [
  {
    id: 'pl1',
    name: 'MOxE Coffee Lab',
    imageUrl: 'https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg',
    distanceKm: 0.4,
    rating: 4.8,
    category: 'Coffee shop',
  },
  {
    id: 'pl2',
    name: 'Sunset Overlook',
    imageUrl: 'https://images.pexels.com/photos/462353/pexels-photo-462353.jpeg',
    distanceKm: 2.1,
    rating: 4.9,
    category: 'Scenic view',
  },
  {
    id: 'pl3',
    name: 'Night Runner Track',
    imageUrl: 'https://images.pexels.com/photos/258045/pexels-photo-258045.jpeg',
    distanceKm: 1.2,
    rating: 4.6,
    category: 'Running track',
  },
];

