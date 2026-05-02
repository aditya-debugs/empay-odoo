const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in settings.controller.js / .service.js,
//        validation in settings.validation.js, then replace `todo` below.

// GET / — Get settings [ADMIN]
router.get('/', requireAuth, requireRole('ADMIN'), todo);

// PATCH /company — Update company settings [ADMIN]
router.patch('/company', requireAuth, requireRole('ADMIN'), todo);

// PATCH /attendance — Update attendance settings [ADMIN]
router.patch('/attendance', requireAuth, requireRole('ADMIN'), todo);

// PATCH /payroll — Update payroll settings [ADMIN]
router.patch('/payroll', requireAuth, requireRole('ADMIN'), todo);

// PATCH /leave — Update leave settings [ADMIN]
router.patch('/leave', requireAuth, requireRole('ADMIN'), todo);

// POST /holidays — Create/update holiday [ADMIN]
router.post('/holidays', requireAuth, requireRole('ADMIN'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
