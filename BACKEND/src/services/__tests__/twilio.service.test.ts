import { sendSms } from '../twilio.service';

describe('twilio.service', () => {
  it('sendSms returns not configured when Twilio env is missing', async () => {
    const result = await sendSms('+1234567890', 'hello');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not configured');
  });
});
