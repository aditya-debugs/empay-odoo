const { Router } = require('express');
const ctrl = require('./employees.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');


const router = Router();

router.use(requireAuth);

// Self-service routes — must come BEFORE /:id parametric routes so that
// "profile" / "bank-details" don't get parsed as an :id.
router.patch('/profile',      ctrl.updateProfile);
router.patch('/bank-details', ctrl.updateBankDetails);

// Directory routes
router.get('/',     ctrl.list);
router.get('/:id',  ctrl.get);

// Administrative routes
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), ctrl.create);
router.patch('/:id', requireRole('ADMIN', 'HR_OFFICER'), ctrl.update);
router.post('/:id/send-credentials', requireRole('ADMIN', 'HR_OFFICER'), ctrl.sendCredentials);

module.exports = router;

