import { Router } from 'express';
import { activateLicense, verifySession, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/activate', activateLicense);
router.post('/verify-session', verifySession);
router.post('/logout', logout);

export default router;
