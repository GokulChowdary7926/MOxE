/**
 * Custom shop domain verification via DNS CNAME (Guide 2.20 / NBK-024).
 * Expected hostname is read from COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET (e.g. commerce.example.com).
 */

import dns from 'dns/promises';

export function normalizeDnsName(hostname: string): string {
  return hostname.trim().replace(/\.$/, '').toLowerCase();
}

/** Public for unit tests. Returns true if any alias matches the expected target (after normalize). */
export function cnameAliasesMatchTarget(aliases: string[], expectedTarget: string): boolean {
  const target = normalizeDnsName(expectedTarget);
  return aliases.some((a) => normalizeDnsName(a) === target);
}

export function getCommerceCnameTarget(): string | null {
  const raw = process.env.COMMERCE_CUSTOM_DOMAIN_CNAME_TARGET?.trim();
  if (!raw) return null;
  return normalizeDnsName(raw);
}

/**
 * Resolve CNAME records for `domain` and check whether any point to `expectedTarget`.
 */
export async function verifyCustomDomainCname(domain: string, expectedTarget: string): Promise<{ ok: boolean; aliases: string[] }> {
  const host = normalizeDnsName(domain);
  try {
    const aliases = await dns.resolveCname(host);
    return { ok: cnameAliasesMatchTarget(aliases, expectedTarget), aliases };
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as NodeJS.ErrnoException).code) : '';
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL') {
      return { ok: false, aliases: [] };
    }
    throw e;
  }
}
