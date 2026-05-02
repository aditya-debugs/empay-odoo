const { Router } = require('express');
const ctrl = require('./employees.controller');
const { requireAuth } = require('../../../middleware/auth');

const router = Router();

router.use(requireAuth);

// GET  /employees       — directory listing (any authenticated user)
router.get('/', ctrl.list);

// GET  /employees/:id   — single employee profile
router.get('/:id', ctrl.get);

// TODO (next iteration): POST /, PATCH /:id, POST /:id/avatar, POST /:id/send-credentials
// These belong to the HR-officer module; admin uses /users for creation.

module.exports = router;
