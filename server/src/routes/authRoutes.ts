import { Router } from 'express';
import { ssoLogin } from '../controllers/authController';

const router = Router();
router.post('/sso-login', ssoLogin);
export default router;
