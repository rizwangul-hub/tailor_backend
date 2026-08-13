import { Router } from 'express';
import {
  login,
  getDashboardStats,
  getLicenses,
  createLicense,
  getLicenseById,
  blockLicense,
  unblockLicense,
  extendLicense,
  changePlan,
  deleteLicense,
  getTenants,
  getAuditLogs
} from '../controllers/admin.controller';
import { requireAdminAuth } from '../middleware/admin.middleware';

const router = Router();

router.post('/auth/login', login);

// Protected routes
router.use(requireAdminAuth);

router.get('/dashboard', getDashboardStats);

router.get('/licenses', getLicenses);
router.post('/licenses', createLicense);
router.get('/licenses/:id', getLicenseById);
router.patch('/licenses/:id/block', blockLicense);
router.patch('/licenses/:id/unblock', unblockLicense);
router.patch('/licenses/:id/extend', extendLicense);
router.patch('/licenses/:id/plan', changePlan);
router.delete('/licenses/:id', deleteLicense);

router.get('/tenants', getTenants);

router.get('/audit-logs', getAuditLogs);

export default router;
