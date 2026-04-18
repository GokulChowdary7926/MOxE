import { AppError } from '../../utils/AppError';
import { AlertService } from '../alert.service';

const mockSendSms = jest.fn();
const mockIsTwilioConfigured = jest.fn(() => false);

jest.mock('../notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
}));

jest.mock('../twilio.service', () => ({
  sendSms: (...args: any[]) => mockSendSms(...args),
  isTwilioConfigured: () => mockIsTwilioConfigured(),
}));

jest.mock('../../server', () => ({
  prisma: {
    alertSchedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    alertRule: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    alertEvent: { create: jest.fn() },
    alertDelivery: { create: jest.fn() },
  },
}));

const { prisma: mockPrisma } = require('../../server');

describe('AlertService', () => {
  const service = new AlertService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createSchedule validates participant list', async () => {
    await expect(
      service.createSchedule('a1', {
        name: 'On call',
        timezone: 'UTC',
        rotationType: 'WEEKLY',
        handoffTime: '09:00',
        participantAccountIds: [],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('createRule rejects unknown schedule ownership', async () => {
    mockPrisma.alertSchedule.findFirst.mockResolvedValue(null);
    await expect(
      service.createRule('a1', {
        scheduleId: 's1',
        name: 'Critical API',
        condition: {},
        severity: 'CRITICAL',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('triggerRule rejects inactive rule', async () => {
    mockPrisma.alertRule.findUnique.mockResolvedValue({ id: 'r1', isActive: false });
    await expect(service.triggerRule('r1')).rejects.toBeInstanceOf(AppError);
  });
});
