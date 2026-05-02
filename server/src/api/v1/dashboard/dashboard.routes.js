const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// GET /employee — Employee dashboard [EMPLOYEE]
router.get('/employee', requireAuth, requireRole('EMPLOYEE'), ctrl.getEmployeeDashboard);

// GET /admin — Admin dashboard [ADMIN]
router.get('/admin', requireAuth, requireRole('ADMIN'), ctrl.getAdminDashboard);

module.exports = router;

