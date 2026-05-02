const { Router } = require('express');
const ctrl = require('./leave.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// POST /apply — Apply for leave [EMPLOYEE]
router.post('/apply', requireAuth, requireRole('EMPLOYEE'), ctrl.applyLeave);

// GET /me — My leave history [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), ctrl.getHistory);

// GET /balance — My leave balance [EMPLOYEE]
router.get('/balance', requireAuth, requireRole('EMPLOYEE'), ctrl.getBalance);

module.exports = router;
