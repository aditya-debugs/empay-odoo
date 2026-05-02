const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./reports.controller');

const router = Router();

// GET /attendance — Attendance report [ADMIN, PAYROLL_OFFICER]
router.get('/attendance', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getAttendanceReport);

// GET /leave — Leave report [ADMIN, HR_OFFICER]
router.get('/leave', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.getLeaveReport);

// GET /payroll — Payroll report [ADMIN, PAYROLL_OFFICER]
router.get('/payroll', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getPayrollReport);

// GET /headcount — Headcount report [ADMIN, HR_OFFICER]
router.get('/headcount', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.getHeadcountReport);

// GET /pf — PF report [ADMIN, PAYROLL_OFFICER]
router.get('/pf', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getPfReport);

// GET /prof-tax — Professional tax report [ADMIN, PAYROLL_OFFICER]
router.get('/prof-tax', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getProfTaxReport);

// GET /ytd — YTD report [ADMIN, PAYROLL_OFFICER]
router.get('/ytd', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getYtdReport);

module.exports = router;
