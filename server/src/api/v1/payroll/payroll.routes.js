const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in payroll.controller.js / .service.js,
//        validation in payroll.validation.js, then replace `todo` below.

// POST /process — Process payroll for a month [PAYROLL_OFFICER]
router.post('/process', requireAuth, requireRole('PAYROLL_OFFICER'), todo);

// GET /preview — Preview payroll [PAYROLL_OFFICER, ADMIN]
router.get('/preview', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// GET /:month — View processed payroll [PAYROLL_OFFICER, ADMIN]
router.get('/:month', requireAuth, requireRole('PAYROLL_OFFICER', 'ADMIN'), todo);

// PATCH /:id/reopen — Reopen processed payroll [ADMIN]
router.patch('/:id/reopen', requireAuth, requireRole('ADMIN'), todo);

// PATCH /:id/bonus — Adjust bonus [ADMIN]
router.patch('/:id/bonus', requireAuth, requireRole('ADMIN'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
