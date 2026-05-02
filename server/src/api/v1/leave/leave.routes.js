const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in leave.controller.js / .service.js,
//        validation in leave.validation.js, then replace `todo` below.

// POST /apply — Apply for leave [EMPLOYEE]
router.post('/apply', requireAuth, requireRole('EMPLOYEE'), todo);

// GET /me — My leave history [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), todo);

// GET /queue — Shared leave queue [ADMIN, HR_OFFICER]
router.get('/queue', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// PATCH /:id/approve — Approve leave [ADMIN, HR_OFFICER]
router.patch('/:id/approve', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// PATCH /:id/reject — Reject leave [ADMIN, HR_OFFICER]
router.patch('/:id/reject', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// POST /policies — Configure leave policy [ADMIN]
router.post('/policies', requireAuth, requireRole('ADMIN'), todo);

// PATCH /balance — Adjust leave balance / allocation [ADMIN, HR_OFFICER]
router.patch('/balance', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
