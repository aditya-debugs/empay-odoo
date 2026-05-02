const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in payslips.controller.js / .service.js,
//        validation in payslips.validation.js, then replace `todo` below.

// GET / — List payslips [PAYROLL_OFFICER, ADMIN]
router.get('/', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// GET /me — My payslips [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), todo);

// GET /:id — Get payslip (self or admin/payroll)
router.get('/:id', requireAuth, todo);

// POST /:id/generate-pdf — Generate PDF for a payslip [PAYROLL_OFFICER, ADMIN]
router.post('/:id/generate-pdf', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// POST /:id/reissue — Reissue revised payslip [ADMIN, PAYROLL_OFFICER]
router.post('/:id/reissue', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
