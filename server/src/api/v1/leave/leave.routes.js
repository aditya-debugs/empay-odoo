const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./leave.controller');

const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = Router();

// GET /me — List own leave history [EMPLOYEE, HR, PAYROLL]
router.get('/me', requireAuth, ctrl.getMyLeaves);

// GET /balance — List own leave balance
router.get('/balance', requireAuth, ctrl.getMyBalance);

// POST /apply — Create leave request (accepts 'attachment' file)
router.post('/apply', requireAuth, requireRole('EMPLOYEE'), upload.single('attachment'), ctrl.apply);

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

