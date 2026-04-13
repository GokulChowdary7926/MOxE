import crypto from 'crypto';
import { AppError } from '../../utils/AppError';

const STATE_TTL_MS = 15 * 60 * 1000;

export function getIntegrationOAuthRedirectUri(): string {
  const backendBase = (process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5007').replace(/\/$/, '');
  return (
    process.env.INTEGRATION_OAUTH_REDIRECT_URI ||
    `${backendBase}/api/job/integrations/oauth/callback`
  );
}

export function signIntegrationOAuthState(
  accountId: string,
  provider: string,
  secret: string,
): string {
  const payload = JSON.stringify({
    accountId,
    provider: provider.toUpperCase(),
    exp: Date.now() + STATE_TTL_MS,
  });
  const data = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyIntegrationOAuthState(
  state: string,
  secret: string,
): { accountId: string; provider: string } {
  const [data, sig] = state.split('.');
  if (!data || !sig) throw new AppError('Invalid OAuth state', 400);
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new AppError('Invalid OAuth state signature', 400);
  }
  const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as {
    accountId: string;
    provider: string;
    exp: number;
  };
  if (!parsed.accountId || !parsed.provider || typeof parsed.exp !== 'number') {
    throw new AppError('Malformed OAuth state', 400);
  }
  if (Date.now() > parsed.exp) throw new AppError('OAuth state expired. Try connecting again.', 400);
  return { accountId: parsed.accountId, provider: parsed.provider };
}

type TokenResult = Record<string, unknown>;

async function postForm(url: string, body: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(body),
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.error_description || data.error || text || `HTTP ${res.status}`;
    throw new AppError(String(msg), 502);
  }
  // Slack Web API style: HTTP 200 with { ok: false, error }
  if (data && typeof data.ok === 'boolean' && data.ok === false) {
    throw new AppError(String(data.error || 'provider_error'), 502);
  }
  return data;
}

/** Build authorize URL or null if this provider is not configured for OAuth. */
export function buildIntegrationAuthorizeUrl(
  provider: string,
  state: string,
): string | null {
  const redirectUri = getIntegrationOAuthRedirectUri();
  const enc = encodeURIComponent;

  switch (provider) {
    case 'GITHUB': {
      const id =
        process.env.INTEGRATION_GITHUB_CLIENT_ID ||
        process.env.GITHUB_INTEGRATION_CLIENT_ID ||
        process.env.GITHUB_CLIENT_ID;
      if (!id) return null;
      const scope = process.env.INTEGRATION_GITHUB_SCOPE || 'read:user repo read:org';
      return `https://github.com/login/oauth/authorize?client_id=${enc(id)}&redirect_uri=${enc(redirectUri)}&scope=${enc(scope)}&state=${enc(state)}`;
    }
    case 'GITLAB': {
      const id = process.env.INTEGRATION_GITLAB_CLIENT_ID || process.env.GITLAB_INTEGRATION_CLIENT_ID;
      if (!id) return null;
      const scope = process.env.INTEGRATION_GITLAB_SCOPE || 'read_api read_repository';
      return `https://gitlab.com/oauth/authorize?client_id=${enc(id)}&redirect_uri=${enc(redirectUri)}&response_type=code&state=${enc(state)}&scope=${enc(scope)}`;
    }
    case 'SLACK': {
      const id = process.env.SLACK_INTEGRATION_CLIENT_ID || process.env.SLACK_CLIENT_ID;
      if (!id) return null;
      const scope =
        process.env.SLACK_INTEGRATION_SCOPE || 'channels:read,chat:write,users:read,team:read';
      return `https://slack.com/oauth/v2/authorize?client_id=${enc(id)}&scope=${enc(scope)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}`;
    }
    case 'JIRA': {
      const id =
        process.env.ATLASSIAN_INTEGRATION_CLIENT_ID ||
        process.env.JIRA_INTEGRATION_CLIENT_ID ||
        process.env.ATLASSIAN_CLIENT_ID;
      if (!id) return null;
      const scope =
        process.env.ATLASSIAN_INTEGRATION_SCOPE ||
        'read:jira-work read:jira-user offline_access';
      return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${enc(id)}&scope=${enc(scope)}&redirect_uri=${enc(redirectUri)}&response_type=code&prompt=consent&state=${enc(state)}`;
    }
    case 'LINEAR': {
      const id = process.env.LINEAR_INTEGRATION_CLIENT_ID || process.env.LINEAR_CLIENT_ID;
      if (!id) return null;
      const scope = process.env.LINEAR_INTEGRATION_SCOPE || 'read,write';
      return `https://linear.app/oauth/authorize?client_id=${enc(id)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc(scope)}&state=${enc(state)}`;
    }
    case 'NOTION': {
      const id = process.env.NOTION_INTEGRATION_CLIENT_ID || process.env.NOTION_CLIENT_ID;
      if (!id) return null;
      const owner = process.env.NOTION_INTEGRATION_OWNER || 'user';
      return `https://api.notion.com/v1/oauth/authorize?client_id=${enc(id)}&response_type=code&owner=${enc(owner)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}`;
    }
    default:
      return null;
  }
}

export async function exchangeIntegrationOAuthCode(
  provider: string,
  code: string,
): Promise<TokenResult> {
  const redirectUri = getIntegrationOAuthRedirectUri();

  switch (provider) {
    case 'GITHUB': {
      const id =
        process.env.INTEGRATION_GITHUB_CLIENT_ID ||
        process.env.GITHUB_INTEGRATION_CLIENT_ID ||
        process.env.GITHUB_CLIENT_ID;
      const secret =
        process.env.INTEGRATION_GITHUB_CLIENT_SECRET ||
        process.env.GITHUB_INTEGRATION_CLIENT_SECRET ||
        process.env.GITHUB_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('GitHub OAuth is not configured on the server', 503);
      const data = await postForm('https://github.com/login/oauth/access_token', {
        client_id: id,
        client_secret: secret,
        code,
        redirect_uri: redirectUri,
      });
      if (!data.access_token) throw new AppError('GitHub did not return access_token', 502);
      return {
        accessToken: data.access_token,
        scope: data.scope,
        tokenType: data.token_type,
        provider: 'GITHUB',
        connectedVia: 'oauth',
      };
    }
    case 'GITLAB': {
      const id = process.env.INTEGRATION_GITLAB_CLIENT_ID || process.env.GITLAB_INTEGRATION_CLIENT_ID;
      const secret =
        process.env.INTEGRATION_GITLAB_CLIENT_SECRET || process.env.GITLAB_INTEGRATION_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('GitLab OAuth is not configured on the server', 503);
      const data = await postForm('https://gitlab.com/oauth/token', {
        client_id: id,
        client_secret: secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      if (!data.access_token) throw new AppError('GitLab did not return access_token', 502);
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + Number(data.expires_in) * 1000 : undefined,
        scope: data.scope,
        tokenType: data.token_type,
        provider: 'GITLAB',
        connectedVia: 'oauth',
      };
    }
    case 'SLACK': {
      const id = process.env.SLACK_INTEGRATION_CLIENT_ID || process.env.SLACK_CLIENT_ID;
      const secret =
        process.env.SLACK_INTEGRATION_CLIENT_SECRET || process.env.SLACK_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('Slack OAuth is not configured on the server', 503);
      const data = await postForm('https://slack.com/api/oauth.v2.access', {
        client_id: id,
        client_secret: secret,
        code,
        redirect_uri: redirectUri,
      });
      return {
        accessToken: data.access_token,
        teamId: data.team?.id,
        teamName: data.team?.name,
        botUserId: data.bot_user_id,
        scope: data.scope,
        provider: 'SLACK',
        connectedVia: 'oauth',
      };
    }
    case 'JIRA': {
      const id =
        process.env.ATLASSIAN_INTEGRATION_CLIENT_ID ||
        process.env.JIRA_INTEGRATION_CLIENT_ID ||
        process.env.ATLASSIAN_CLIENT_ID;
      const secret =
        process.env.ATLASSIAN_INTEGRATION_CLIENT_SECRET ||
        process.env.JIRA_INTEGRATION_CLIENT_SECRET ||
        process.env.ATLASSIAN_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('Atlassian / Jira OAuth is not configured on the server', 503);
      const res = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: id,
          client_secret: secret,
          code,
          redirect_uri: redirectUri,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new AppError(data.error_description || data.error || 'Atlassian token exchange failed', 502);
      }
      if (!data.access_token) throw new AppError('Atlassian did not return access_token', 502);
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + Number(data.expires_in) * 1000 : undefined,
        scope: data.scope,
        tokenType: data.token_type,
        provider: 'JIRA',
        connectedVia: 'oauth',
      };
    }
    case 'LINEAR': {
      const id = process.env.LINEAR_INTEGRATION_CLIENT_ID || process.env.LINEAR_CLIENT_ID;
      const secret =
        process.env.LINEAR_INTEGRATION_CLIENT_SECRET || process.env.LINEAR_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('Linear OAuth is not configured on the server', 503);
      const data = await postForm('https://api.linear.app/oauth/token', {
        grant_type: 'authorization_code',
        client_id: id,
        client_secret: secret,
        redirect_uri: redirectUri,
        code,
      });
      if (!data.access_token) throw new AppError('Linear did not return access_token', 502);
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        expiresAt: data.expires_in ? Date.now() + Number(data.expires_in) * 1000 : undefined,
        provider: 'LINEAR',
        connectedVia: 'oauth',
      };
    }
    case 'NOTION': {
      const id = process.env.NOTION_INTEGRATION_CLIENT_ID || process.env.NOTION_CLIENT_ID;
      const secret =
        process.env.NOTION_INTEGRATION_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
      if (!id || !secret) throw new AppError('Notion OAuth is not configured on the server', 503);
      const auth = Buffer.from(`${id}:${secret}`).toString('base64');
      const res = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new AppError(data.error || data.message || 'Notion token exchange failed', 502);
      }
      if (!data.access_token) throw new AppError('Notion did not return access_token', 502);
      return {
        accessToken: data.access_token,
        workspaceId: data.workspace_id,
        workspaceName: data.workspace_name,
        botId: data.bot_id,
        provider: 'NOTION',
        connectedVia: 'oauth',
      };
    }
    default:
      throw new AppError(`OAuth not implemented for provider ${provider}`, 501);
  }
}
