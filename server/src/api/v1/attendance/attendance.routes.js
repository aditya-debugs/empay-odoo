const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in attendance.controller.js / .service.js,
//        validation in attendance.validation.js, then replace `todo` below.

// POST /check-in — Employee check-in [EMPLOYEE]
router.post('/check-in', requireAuth, requireRole('EMPLOYEE'), todo);

// POST /check-out — Employee check-out [EMPLOYEE]
router.post('/check-out', requireAuth, requireRole('EMPLOYEE'), todo);

// GET /me — My attendance history [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), todo);

// GET / — List attendance (filters, daily/weekly/monthly) [ADMIN, HR_OFFICER]
router.get('/', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// GET /monthly — Monthly attendance summary [ADMIN, HR_OFFICER]
router.get('/monthly', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// GET /:employeeId — Specific employee attendance [ADMIN, HR_OFFICER]
router.get('/:employeeId', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// PATCH /:id/override — Manual override [ADMIN]
router.patch('/:id/override', requireAuth, requireRole('ADMIN'), todo);

// GET /:id/audit — Override audit trail [ADMIN]
router.get('/:id/audit', requireAuth, requireRole('ADMIN'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
