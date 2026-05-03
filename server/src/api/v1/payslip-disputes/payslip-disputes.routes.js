const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./payslip-disputes.controller');

const router = Router();

// POST / — Raise dispute [EMPLOYEE]
router.post('/', requireAuth, requireRole('EMPLOYEE'), ctrl.raiseDispute);

// GET /me — My disputes [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), ctrl.getMyDisputes);

// GET / — Dispute queue
//   ADMIN + PAYROLL_OFFICER → all disputes
//   HR_OFFICER              → only HR-routed disputes
router.get('/', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER', 'HR_OFFICER'), ctrl.getQueue);

// PATCH /:id/resolve — Resolve/reject a dispute
//   ADMIN + PAYROLL_OFFICER → can resolve any dispute
//   HR_OFFICER              → can resolve HR-routed disputes
router.patch('/:id/resolve', requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER', 'HR_OFFICER'), ctrl.resolve);

module.exports = router;
