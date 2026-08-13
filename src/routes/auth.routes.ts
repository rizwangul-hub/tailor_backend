import { Router } from 'express';
import { activateLicense, verifySession } from '../controllers/auth.controller';

const router = Router();

router.post('/activate', activateLicense);
router.post('/verify-session', verifySession);

export default router;
