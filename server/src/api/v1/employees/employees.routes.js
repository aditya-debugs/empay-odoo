const { Router } = require('express');
const ctrl = require('./employees.controller');
const { requireAuth } = require('../../../middleware/auth');

const router = Router();

router.use(requireAuth);

// Self-service routes — must come BEFORE /:id parametric routes so that
// "profile" / "bank-details" don't get parsed as an :id.
router.patch('/profile',      ctrl.updateProfile);
router.patch('/bank-details', ctrl.updateBankDetails);

// Directory routes
router.get('/',     ctrl.list);
router.get('/:id',  ctrl.get);

// TODO (next iteration): POST /, PATCH /:id, POST /:id/avatar, POST /:id/send-credentials
// HR-officer module owns admin-side employee creation; admin uses /users for creation.

module.exports = router;
