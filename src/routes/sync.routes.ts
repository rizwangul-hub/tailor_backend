import { Router } from 'express';
import { pushSync, pullSync, restoreTenantData } from '../controllers/sync.controller';

const router = Router();

router.post('/push', pushSync);
router.post('/pull', pullSync);
router.post('/restore', restoreTenantData);

export default router;
