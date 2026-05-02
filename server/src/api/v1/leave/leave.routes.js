const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./leave.controller');

const router = Router();

// GET /me — List own leave history [EMPLOYEE, HR, PAYROLL]
router.get('/me', requireAuth, ctrl.getMyLeaves);

// GET /balance — List own leave balance
router.get('/balance', requireAuth, ctrl.getMyBalance);

// POST /apply — Create leave request
router.post('/apply', requireAuth, requireRole('EMPLOYEE'), ctrl.apply);

// Admin/HR routes for approval
router.get('/queue', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.listQueue);
router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.updateStatus);

module.exports = router;
