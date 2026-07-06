"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const validateRequest_1 = require("../../middleware/validateRequest");
const auth_validation_1 = require("./auth.validation");
const credential_validation_1 = require("./credential.validation");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// POST /api/auth/login — rate-limited, validated
router.post('/login', (0, rateLimiter_1.createLoginRateLimiter)(), (0, validateRequest_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.login);
// POST /api/auth/refresh — uses httpOnly cookie
router.post('/refresh', auth_controller_1.refresh);
// POST /api/auth/logout — requires auth
router.post('/logout', auth_1.authMiddleware, auth_controller_1.logout);
// GET /api/auth/me — requires auth
router.get('/me', auth_1.authMiddleware, auth_controller_1.getMe);
// PUT /api/auth/credentials — requires auth, validated
router.put('/credentials', auth_1.authMiddleware, (0, validateRequest_1.validateRequest)(credential_validation_1.changeCredentialsSchema), auth_controller_1.updateCredentials);
//# sourceMappingURL=auth.routes.js.map