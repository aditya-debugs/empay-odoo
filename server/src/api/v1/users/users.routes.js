const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in users.controller.js / .service.js,
//        validation in users.validation.js, then replace `todo` below.

// POST / — Create user (admin creates HR/Payroll/Employee) [ADMIN]
router.post('/', requireAuth, requireRole('ADMIN'), todo);

// GET / — List users with filters [ADMIN]
router.get('/', requireAuth, requireRole('ADMIN'), todo);

// GET /:id — Get user [ADMIN]
router.get('/:id', requireAuth, requireRole('ADMIN'), todo);

// PATCH /:id — Update user [ADMIN]
router.patch('/:id', requireAuth, requireRole('ADMIN'), todo);

// PATCH /:id/deactivate — Soft delete user [ADMIN]
router.patch('/:id/deactivate', requireAuth, requireRole('ADMIN'), todo);

// DELETE /:id — Hard delete user [ADMIN]
router.delete('/:id', requireAuth, requireRole('ADMIN'), todo);

// PATCH /:id/reset-password — Reset user credentials [ADMIN]
router.patch('/:id/reset-password', requireAuth, requireRole('ADMIN'), todo);

// PATCH /:id/change-role — Change user role [ADMIN]
router.patch('/:id/change-role', requireAuth, requireRole('ADMIN'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
