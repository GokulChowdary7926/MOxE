import { Router } from 'express';
import { COMMON_BASIC_FEATURES, ACCOUNT_FEATURE_GROUPS } from '../constants/features';

const router = Router();

router.get('/basic', (_req, res) => {
  res.json({
    features: COMMON_BASIC_FEATURES,
  });
});

router.get('/account/:type', (req, res) => {
  const type = String(req.params.type || '').toUpperCase();
  const group = (ACCOUNT_FEATURE_GROUPS as any)[type];
  if (!group) {
    return res.status(400).json({ error: 'Unknown account type' });
  }
  res.json({
    accountType: type,
    features: group,
  });
});

export default router;

