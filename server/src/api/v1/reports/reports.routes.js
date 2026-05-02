const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./reports.controller');

const router = Router();

// GET /attendance — Attendance report [ADMIN, PAYROLL_OFFICER]
router.get('/attendance', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.attendance);

// GET /leave — Leave report [ADMIN, HR_OFFICER]
router.get('/leave', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.leave);

// GET /payroll — Payroll report [ADMIN, PAYROLL_OFFICER]
router.get('/payroll', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.payroll);

// GET /headcount — Headcount report [ADMIN, HR_OFFICER]
router.get('/headcount', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.headcount);

// GET /pf — PF report [ADMIN, PAYROLL_OFFICER]
router.get('/pf', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.pf);

// GET /prof-tax — Professional tax report [ADMIN, PAYROLL_OFFICER]
router.get('/prof-tax', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.profTax);

// GET /ytd — YTD report [ADMIN, PAYROLL_OFFICER]
router.get('/ytd', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.ytd);

module.exports = router;
