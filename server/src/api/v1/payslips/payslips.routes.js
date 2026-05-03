const { Router } = require('express');
const ctrl = require('./payslips.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

router.use(requireAuth);

// Employee — list own
router.get('/me', requireRole('EMPLOYEE'), ctrl.getPayslips);

// Admin / Payroll — list all
router.get('/', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.listAll);

// Special endpoints
router.get('/draft', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.getDraft);
router.post('/new', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.createIndividual);

// Single payslip actions
router.get('/:id', ctrl.getPayslipDetail);
router.post('/:id/compute', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.compute);
router.post('/:id/validate', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.validate);
router.patch('/:id/cancel', requireRole('ADMIN', 'PAYROLL_OFFICER'), ctrl.cancel);

module.exports = router;
