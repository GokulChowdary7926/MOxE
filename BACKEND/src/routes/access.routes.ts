import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AccessService } from '../services/access.service';

const router = Router();
const access = new AccessService();

router.use(authenticate);

router.get('/orgs', async (_req, res, next) => {
  try {
    const orgs = await access.listOrgs();
    res.json(orgs);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs', async (req, res, next) => {
  try {
    const { name, domain } = req.body || {};
    const org = await access.createOrg(name, domain);
    res.status(201).json(org);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/departments', async (req, res, next) => {
  try {
    const list = await access.listDepartments(req.params.orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/departments', async (req, res, next) => {
  try {
    const dept = await access.createDepartment(req.params.orgId, (req.body || {}).name, (req.body || {}).parentId);
    res.status(201).json(dept);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/roles', async (req, res, next) => {
  try {
    const list = await access.listRoles(req.params.orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/roles', async (req, res, next) => {
  try {
    const role = await access.createRole(req.params.orgId, (req.body || {}).name);
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/groups', async (req, res, next) => {
  try {
    const list = await access.listGroups(req.params.orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// SSO configuration (8.1.2)

router.get('/orgs/:orgId/sso', async (req, res, next) => {
  try {
    const cfg = await access.getSsoConfig(req.params.orgId);
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/sso', async (req, res, next) => {
  try {
    const cfg = await access.configureSso(req.params.orgId, req.body || {});
    res.status(201).json(cfg);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/sso/domains', async (req, res, next) => {
  try {
    const { domains } = req.body || {};
    const cfg = await access.setSsoDomains(req.params.orgId, Array.isArray(domains) ? domains : []);
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/sso/enforcement', async (req, res, next) => {
  try {
    const { enforcementLevel } = req.body || {};
    const cfg = await access.setSsoEnforcement(req.params.orgId, enforcementLevel || 'optional');
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/sso/test', async (req, res, next) => {
  try {
    const result = await access.testSsoConnection(req.params.orgId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/sso/activate', async (req, res, next) => {
  try {
    const { isActive } = req.body || {};
    const cfg = await access.activateSso(req.params.orgId, !!isActive);
    res.json(cfg);
  } catch (e) {
    next(e);
  }
});

// MFA policy (8.1.3)

router.get('/orgs/:orgId/mfa-policy', async (req, res, next) => {
  try {
    const policy = await access.getMfaPolicy(req.params.orgId);
    res.json(policy);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/mfa-policy', async (req, res, next) => {
  try {
    const policy = await access.setMfaPolicy(req.params.orgId, req.body || {});
    res.status(201).json(policy);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/mfa/compliance', async (req, res, next) => {
  try {
    const summary = await access.getMfaCompliance(req.params.orgId);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:orgId/groups', async (req, res, next) => {
  try {
    const group = await access.createGroup(req.params.orgId, (req.body || {}).name);
    res.status(201).json(group);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/invitations', async (req, res, next) => {
  try {
    const list = await access.listInvitations(req.params.orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:orgId/users', async (req, res, next) => {
  try {
    const list = await access.listUsers(req.params.orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const adminAccountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!adminAccountId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await access.addUser(adminAccountId, req.body || {});
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const adminAccountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!adminAccountId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await access.updateUser(adminAccountId, req.params.id, req.body || {});
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.post('/users/import', async (req, res, next) => {
  try {
    const adminAccountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!adminAccountId) return res.status(401).json({ error: 'Unauthorized' });
    const { orgId, rows } = req.body || {};
    if (!orgId || !Array.isArray(rows)) return res.status(400).json({ error: 'orgId and rows[] required' });
    const result = await access.importUsers(adminAccountId, orgId, rows);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/invitations', async (req, res, next) => {
  try {
    const adminAccountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!adminAccountId) return res.status(401).json({ error: 'Unauthorized' });
    const invite = await access.createInvitation(adminAccountId, req.body || {});
    res.status(201).json(invite);
  } catch (e) {
    next(e);
  }
});

router.post('/invitations/accept', async (req, res, next) => {
  try {
    const accountId = (req as any).user?.accountId || (req as any).user?.userId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });
    const orgUser = await access.acceptInvitation(token, accountId);
    res.json(orgUser);
  } catch (e) {
    next(e);
  }
});

export default router;


