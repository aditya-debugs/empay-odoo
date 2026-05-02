const { Router } = require('express');
const ctrl = require('./attendance.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// POST /check-in — Employee check-in [EMPLOYEE]
router.post('/check-in', requireAuth, requireRole('EMPLOYEE'), ctrl.checkIn);

// POST /check-out — Employee check-out [EMPLOYEE]
router.post('/check-out', requireAuth, requireRole('EMPLOYEE'), ctrl.checkOut);

// GET / — List all attendance records [ADMIN, HR_OFFICER]
router.get('/', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.listAll);

// GET /me — My attendance history [EMPLOYEE]
router.get('/me', requireAuth, requireRole('EMPLOYEE'), ctrl.getHistory);

// POST /regularize — Employee requests regularization [EMPLOYEE]
router.post('/regularize', requireAuth, requireRole('EMPLOYEE'), ctrl.raiseRegularization);

// GET /regularize — List all regularization requests [ADMIN, HR_OFFICER]
router.get('/regularize', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.listRegularizations);

// PATCH /regularize/:id — Review a regularization request [ADMIN, HR_OFFICER]
router.patch('/regularize/:id', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), ctrl.reviewRegularization);

module.exports = router;


