const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in payslip-disputes.controller.js / .service.js,
//        validation in payslip-disputes.validation.js, then replace `todo` below.

// POST / — Raise dispute [EMPLOYEE]
router.post('/', requireAuth, requireRole('EMPLOYEE'), todo);

// GET /me — My disputes [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), todo);

// GET / — Dispute queue [ADMIN, PAYROLL_OFFICER]
router.get('/', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), todo);

// PATCH /:id/resolve — Resolve dispute [PAYROLL_OFFICER, ADMIN]
router.patch('/:id/resolve', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// PATCH /:id/reissue — Trigger revised payslip [PAYROLL_OFFICER, ADMIN]
router.patch('/:id/reissue', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// PATCH /:id/reject — Reject dispute [PAYROLL_OFFICER, ADMIN]
router.patch('/:id/reject', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
