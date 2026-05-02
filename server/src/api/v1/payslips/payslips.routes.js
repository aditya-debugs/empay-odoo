const { Router } = require('express');
const ctrl = require('./payslips.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// GET /me — My payslips [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), ctrl.getPayslips);

// GET /:id — Get payslip detail
router.get('/:id', requireAuth, ctrl.getPayslipDetail);

module.exports = router;
