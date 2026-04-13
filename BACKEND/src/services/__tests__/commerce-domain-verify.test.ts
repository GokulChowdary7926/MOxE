import dns from 'dns/promises';
import {
  cnameAliasesMatchTarget,
  normalizeDnsName,
  verifyCustomDomainCname,
} from '../commerce-domain-verify';

jest.mock('dns/promises', () => ({
  resolveCname: jest.fn(),
}));

const resolveCname = dns.resolveCname as jest.MockedFunction<typeof dns.resolveCname>;

describe('commerce-domain-verify', () => {
  beforeEach(() => {
    resolveCname.mockReset();
  });

  describe('normalizeDnsName', () => {
    it('lowercases and strips trailing dot', () => {
      expect(normalizeDnsName('Shop.Example.COM.')).toBe('shop.example.com');
    });
  });

  describe('cnameAliasesMatchTarget', () => {
    it('returns true when an alias matches target', () => {
      expect(cnameAliasesMatchTarget(['commerce.platform.com.'], 'commerce.platform.com')).toBe(true);
    });
    it('returns false when aliases point elsewhere', () => {
      expect(cnameAliasesMatchTarget(['evil.com'], 'commerce.platform.com')).toBe(false);
    });
  });

  describe('verifyCustomDomainCname', () => {
    it('returns ok when CNAME matches expected target', async () => {
      resolveCname.mockResolvedValue(['commerce.platform.com.']);
      const r = await verifyCustomDomainCname('shop.brand.com', 'commerce.platform.com');
      expect(r.ok).toBe(true);
      expect(r.aliases).toEqual(['commerce.platform.com.']);
    });

    it('returns not ok when CNAME points to wrong host', async () => {
      resolveCname.mockResolvedValue(['other.cdn.net']);
      const r = await verifyCustomDomainCname('shop.brand.com', 'commerce.platform.com');
      expect(r.ok).toBe(false);
    });

    it('returns not ok when ENODATA (no CNAME)', async () => {
      const err = Object.assign(new Error('queryCname ENODATA'), { code: 'ENODATA' });
      resolveCname.mockRejectedValue(err);
      const r = await verifyCustomDomainCname('shop.brand.com', 'commerce.platform.com');
      expect(r.ok).toBe(false);
      expect(r.aliases).toEqual([]);
    });

    it('rethrows unexpected DNS errors', async () => {
      resolveCname.mockRejectedValue(new Error('network down'));
      await expect(verifyCustomDomainCname('shop.brand.com', 'commerce.platform.com')).rejects.toThrow('network down');
    });
  });
});
