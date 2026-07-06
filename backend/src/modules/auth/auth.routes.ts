import { Router } from 'express';
import { login, refresh, logout, getMe, updateCredentials } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';
import { createLoginRateLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema } from './auth.validation';
import { changeCredentialsSchema } from './credential.validation';

const router = Router();

// POST /api/auth/login — rate-limited, validated
router.post('/login', createLoginRateLimiter(), validateRequest(loginSchema), login);

// POST /api/auth/refresh — uses httpOnly cookie
router.post('/refresh', refresh);

// POST /api/auth/logout — requires auth
router.post('/logout', authMiddleware, logout);

// GET /api/auth/me — requires auth
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/credentials — requires auth, validated
router.put('/credentials', authMiddleware, validateRequest(changeCredentialsSchema), updateCredentials);

export { router as authRoutes };
