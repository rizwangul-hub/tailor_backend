import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import syncRoutes from './sync.routes';

import adminRoutes from './admin.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/sync', syncRoutes);
router.use('/admin', adminRoutes);

export default router;
