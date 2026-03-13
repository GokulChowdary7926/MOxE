import { mockUsers } from './users';

export type MockProximityAlert = {
  id: string;
  targetUserId: string;
  radiusKm: number;
  cooldownMinutes: number;
  isActive: boolean;
};

export const mockProximityAlerts: MockProximityAlert[] = [
  {
    id: 'a1',
    targetUserId: mockUsers[1].id,
    radiusKm: 0.5,
    cooldownMinutes: 30,
    isActive: true,
  },
  {
    id: 'a2',
    targetUserId: mockUsers[3].id,
    radiusKm: 1,
    cooldownMinutes: 60,
    isActive: false,
  },
];

