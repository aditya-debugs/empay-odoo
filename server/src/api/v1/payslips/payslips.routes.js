const { Router } = require('express');
const ctrl = require('./payslips.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

router.use(requireAuth);

// Employee — list own
router.get('/me', requireRole('EMPLOYEE'), ctrl.getPayslips);

// Admin / Payroll — list all
router.get('/', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.listAll);

// Single payslip — controller enforces self vs admin/payroll
router.get('/:id', ctrl.getPayslipDetail);

module.exports = router;
