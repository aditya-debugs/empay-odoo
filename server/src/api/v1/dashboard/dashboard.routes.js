const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in dashboard.controller.js / .service.js,
//        validation in dashboard.validation.js, then replace `todo` below.

// GET /admin/summary — Admin dashboard summary [ADMIN]
router.get('/admin/summary', requireAuth, requireRole('ADMIN'), todo);

// GET /admin/attendance — Admin attendance analytics [ADMIN]
router.get('/admin/attendance', requireAuth, requireRole('ADMIN'), todo);

// GET /admin/payroll — Admin payroll analytics [ADMIN]
router.get('/admin/payroll', requireAuth, requireRole('ADMIN'), todo);

// GET /admin/headcount — Department headcount [ADMIN]
router.get('/admin/headcount', requireAuth, requireRole('ADMIN'), todo);

// GET /admin/activity — Recent activity feed [ADMIN]
router.get('/admin/activity', requireAuth, requireRole('ADMIN'), todo);

// GET /hr — HR dashboard [HR_OFFICER]
router.get('/hr', requireAuth, requireRole('HR_OFFICER'), todo);

// GET /payroll — Payroll dashboard [PAYROLL_OFFICER]
router.get('/payroll', requireAuth, requireRole('PAYROLL_OFFICER'), todo);

// GET /employee — Employee dashboard [EMPLOYEE]
router.get('/employee', requireAuth, requireRole('EMPLOYEE'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
