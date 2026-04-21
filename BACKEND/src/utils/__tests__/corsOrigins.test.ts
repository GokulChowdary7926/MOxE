import { getCorsOriginAllowlist, isCorsOriginAllowed } from '../corsOrigins';

describe('corsOrigins', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('isCorsOriginAllowed accepts localhost with any port', () => {
    const list = ['https://app.example.com'];
    expect(isCorsOriginAllowed('http://localhost:3001', list)).toBe(true);
    expect(isCorsOriginAllowed('http://127.0.0.1:5173', list)).toBe(true);
  });

  it('isCorsOriginAllowed accepts listed origin', () => {
    expect(isCorsOriginAllowed('https://app.example.com', ['https://app.example.com'])).toBe(true);
  });

  it('isCorsOriginAllowed rejects unknown production origin', () => {
    expect(isCorsOriginAllowed('https://evil.example.com', ['https://app.example.com'])).toBe(false);
  });

  it('getCorsOriginAllowlist merges CLIENT_URL and ALLOWED_ORIGINS', () => {
    process.env.CLIENT_URL = 'https://a.com';
    process.env.ALLOWED_ORIGINS = 'https://b.com, https://c.com ';
    const list = getCorsOriginAllowlist();
    expect(list).toContain('https://a.com');
    expect(list).toContain('https://b.com');
    expect(list).toContain('https://c.com');
  });
});
