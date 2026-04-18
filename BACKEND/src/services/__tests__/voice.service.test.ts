import { VoiceService } from '../voice.service';

const mockTriggerSOS = jest.fn();

jest.mock('../safety.service', () => ({
  SafetyService: jest.fn().mockImplementation(() => ({
    triggerSOS: mockTriggerSOS,
  })),
}));

describe('VoiceService', () => {
  const service = new VoiceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns UNKNOWN for empty command', async () => {
    const result = await service.processCommand('a1', '   ');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.message).toContain('No command heard');
  });

  it('detects SOS intent and triggers safety service', async () => {
    mockTriggerSOS.mockResolvedValue({ ok: true });
    const result = await service.processCommand('a1', 'help me now');
    expect(result).toMatchObject({
      intent: 'SOS',
      trigger: true,
    });
    expect(mockTriggerSOS).toHaveBeenCalledWith('a1', {});
  });

  it('detects schedule post intent without trigger', async () => {
    const result = await service.processCommand('a1', 'schedule reel for tomorrow');
    expect(result).toMatchObject({
      intent: 'SCHEDULE_POST',
      trigger: false,
    });
  });

  it('returns UNKNOWN for unmatched command', async () => {
    const result = await service.processCommand('a1', 'turn on bluetooth');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.message).toContain('Could not match command');
  });
});
