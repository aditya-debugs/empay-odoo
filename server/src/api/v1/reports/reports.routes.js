const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./reports.controller');

const router = Router();

// Reports access is restricted to ADMIN and functional officers
router.get('/attendance', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.attendance);
router.get('/leave',      requireAuth, requireRole('ADMIN', 'HR_OFFICER'),      ctrl.leave);
router.get('/payroll',    requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.payroll);
router.get('/headcount',  requireAuth, requireRole('ADMIN', 'HR_OFFICER'),      ctrl.headcount);
router.get('/pf',         requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.pf);
router.get('/prof-tax',   requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.profTax);
router.get('/ytd',        requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.ytd);

module.exports = router;
