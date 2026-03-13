import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CompassService } from '../services/job/compass.service';

const router = Router();
const compassService = new CompassService();

router.use(authenticate as any);
router.use((req: any, _res, next) => {
  req.account = req.account || (req.user?.accountId ? { id: req.user.accountId } : null);
  next();
});

// List services for current JOB account
router.get('/services', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const services = await compassService.listServices(accountId);
    res.json(services);
  } catch (err) {
    next(err);
  }
});

// Register a new service
router.post('/services', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const service = await compassService.registerService(accountId, req.body || {});
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
});

// Update service metadata
router.patch('/services/:serviceId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const service = await compassService.updateService(accountId, serviceId, req.body || {});
    res.json(service);
  } catch (err) {
    next(err);
  }
});

// Set dependencies for a service
router.post('/services/:serviceId/dependencies', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const { dependencyIds } = req.body || {};
    const result = await compassService.setDependencies(accountId, serviceId, Array.isArray(dependencyIds) ? dependencyIds : []);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get service detail + health summary
router.get('/services/:serviceId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const detail = await compassService.getServiceDetail(accountId, serviceId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

// Get health check configuration
router.get('/services/:serviceId/health-config', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const cfg = await compassService.getHealthConfig(accountId, serviceId);
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

// Update health check configuration
router.patch('/services/:serviceId/health-config', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const cfg = await compassService.updateHealthConfig(accountId, serviceId, req.body?.healthConfig || req.body || {});
    res.json(cfg);
  } catch (err) {
    next(err);
  }
});

// List documentation links for a service
router.get('/services/:serviceId/docs', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const docs = await compassService.listDocs(accountId, serviceId);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Add a documentation link to a service
router.post('/services/:serviceId/docs', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId } = req.params;
    const { pageId, docType } = req.body || {};
    const doc = await compassService.addDoc(accountId, serviceId, { pageId, docType });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// Remove a documentation link from a service
router.delete('/services/:serviceId/docs/:docId', async (req: any, res, next) => {
  try {
    const accountId = req.account.id as string;
    const { serviceId, docId } = req.params;
    const result = await compassService.removeDoc(accountId, serviceId, docId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

