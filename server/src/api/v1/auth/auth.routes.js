const { Router } = require('express');
const ctrl = require('./auth.controller');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { registerAdminSchema, loginSchema } = require('./auth.validation');

const router = Router();

router.get('/admin-exists', ctrl.adminExists);
router.post('/register-admin', validate(registerAdminSchema), ctrl.registerAdmin);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

// TODO (Phase 2): /refresh-token, /forgot-password, /reset-password,
//                 /change-password, /verify-email
module.exports = router;
