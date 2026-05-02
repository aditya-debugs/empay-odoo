const { Router } = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth');

const router = Router();

// TODO — Implement controllers in employees.controller.js / .service.js,
//        validation in employees.validation.js, then replace `todo` below.

// POST / — Create employee (HR-restricted creation) [ADMIN, HR_OFFICER]
router.post('/', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// GET / — List employees with search/filter
router.get('/', requireAuth, todo);

// GET /:id — Get employee profile
router.get('/:id', requireAuth, todo);

// PATCH /:id — Edit employee [ADMIN, HR_OFFICER]
router.patch('/:id', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

// POST /:id/avatar — Upload avatar (self or admin/hr)
router.post('/:id/avatar', requireAuth, todo);

// POST /:id/send-credentials — Resend login credentials email [ADMIN, HR_OFFICER]
router.post('/:id/send-credentials', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), todo);

function todo(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = router;
