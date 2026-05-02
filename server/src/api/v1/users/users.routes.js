const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const ctrl = require('./users.controller');

const router = Router();

// POST / — Create user (admin creates HR/Payroll/Employee) [ADMIN]
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);

// GET / — List users with filters [ADMIN]
router.get('/', requireAuth, requireRole('ADMIN'), ctrl.list);

// TODO — Implement remaining endpoints as needed
// GET /:id — Get user [ADMIN]
// ...

module.exports = router;
