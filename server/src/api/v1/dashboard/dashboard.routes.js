const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// GET /employee — Employee dashboard [EMPLOYEE]
router.get('/employee', requireAuth, requireRole('EMPLOYEE'), ctrl.getEmployeeDashboard);

// GET /admin — Admin dashboard [ADMIN]
router.get('/admin', requireAuth, requireRole('ADMIN'), ctrl.getAdminDashboard);

// GET /payroll — Payroll dashboard [PAYROLL_OFFICER]
router.get('/payroll', requireAuth, requireRole('PAYROLL_OFFICER'), ctrl.getPayrollDashboard);

module.exports = router;
