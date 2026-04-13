import { parseApiErrorBody } from './readApiError';
import { readApiError } from './readApiError';

describe('parseApiErrorBody', () => {
  it('prefers JSON error field', () => {
    expect(parseApiErrorBody('{"error":"No access"}', 'Bad Request', 403)).toBe('No access');
  });

  it('uses plain text when not JSON', () => {
    expect(parseApiErrorBody('upstream timeout', 'Bad Gateway', 502)).toBe('upstream timeout');
  });

  it('falls back to status text when body empty', () => {
    expect(parseApiErrorBody('   ', 'Unauthorized', 401)).toBe('Unauthorized');
  });

  it('truncates very long plain-text body', () => {
    const text = 'x'.repeat(400);
    const parsed = parseApiErrorBody(text, 'Bad Request', 400);
    expect(parsed.length).toBeLessThan(300);
    expect(parsed.endsWith('…')).toBe(true);
  });

  it('supports JSON message field when error missing', () => {
    expect(parseApiErrorBody('{"message":"Token expired"}', 'Unauthorized', 401)).toBe('Token expired');
  });
});

describe('readApiError', () => {
  it('reads text response and parses JSON error', async () => {
    const res = {
      text: async () => '{"error":"Invalid credentials"}',
      statusText: 'Unauthorized',
      status: 401,
    } as unknown as Response;
    await expect(readApiError(res)).resolves.toBe('Invalid credentials');
  });

  it('handles response.text failure gracefully', async () => {
    const res = {
      text: async () => {
        throw new Error('stream failed');
      },
      statusText: 'Server Error',
      status: 500,
    } as unknown as Response;
    await expect(readApiError(res)).resolves.toBe('Server Error');
  });
});
