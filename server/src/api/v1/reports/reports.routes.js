const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in reports.controller.js / .service.js,
//        validation in reports.validation.js, then replace `todo` below.

// GET /attendance — Attendance report [ADMIN, PAYROLL_OFFICER]
router.get('/attendance', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

// GET /leave — Leave report [ADMIN, HR_OFFICER]
router.get('/leave', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// GET /payroll — Payroll report [ADMIN, PAYROLL_OFFICER]
router.get('/payroll', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

// GET /headcount — Headcount report [ADMIN, HR_OFFICER]
router.get('/headcount', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// GET /pf — PF report [ADMIN, PAYROLL_OFFICER]
router.get('/pf', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

// GET /prof-tax — Professional tax report [ADMIN, PAYROLL_OFFICER]
router.get('/prof-tax', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

// GET /ytd — YTD report [ADMIN, PAYROLL_OFFICER]
router.get('/ytd', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
