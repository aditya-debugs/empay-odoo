const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./leave.controller');

const router = Router();

// GET /me — List own leave history [EMPLOYEE, HR, PAYROLL]
router.get('/me', requireAuth, ctrl.getMyLeaves);

// GET /balance — List own leave balance
router.get('/balance', requireAuth, ctrl.getMyBalance);

// POST /apply — Create leave request
router.post('/apply', requireAuth, requireRole('EMPLOYEE'), ctrl.apply);

// Admin/HR/Payroll routes for approval
router.get('/queue', requireAuth, requireRole('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'), ctrl.listQueue);
router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'), ctrl.updateStatus);

// HR specific: Get another employee's leaves
router.get('/employee/:employeeId', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), async (req, res, next) => {
  try {
    const result = await service.getEmployeeLeaves(req.params.employeeId);
    res.json(result);
  } catch (e) { next(e); }
});
// Leave Allocation (HR Only per requirements)
router.post('/allocation', requireAuth, requireRole('HR_OFFICER'), ctrl.allocate);
router.get('/allocation', requireAuth, requireRole('HR_OFFICER'), ctrl.listAllocations);

module.exports = router;

