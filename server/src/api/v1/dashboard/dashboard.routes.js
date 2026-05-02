const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// GET /employee — Employee dashboard [EMPLOYEE]
router.get('/employee', requireAuth, requireRole('EMPLOYEE'), ctrl.getEmployeeDashboard);

// GET /admin — Admin dashboard [ADMIN]
router.get('/admin', requireAuth, requireRole('ADMIN'), ctrl.getAdminDashboard);

// GET /hr — HR dashboard [ADMIN, HR_OFFICER]
router.get('/hr', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.getHRDashboard);


module.exports = router;

