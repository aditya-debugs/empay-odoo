const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./payslip-disputes.controller');

const router = Router();

// POST / — Raise dispute [EMPLOYEE]
router.post('/', requireAuth, requireRole('EMPLOYEE'), ctrl.raiseDispute);

// GET /me — My disputes [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), ctrl.getMyDisputes);

// GET / — Dispute queue [ADMIN, PAYROLL_OFFICER]
router.get('/', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getQueue);

// PATCH /:id/resolve — Resolve dispute [PAYROLL_OFFICER, ADMIN]
router.patch('/:id/resolve', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), ctrl.resolve);

module.exports = router;
