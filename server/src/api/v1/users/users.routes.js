const { Router } = require('express');
const ctrl = require('./users.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const { createUserSchema, changeRoleSchema } = require('./users.validation');

const router = Router();

// All routes admin-only
router.use(requireAuth, requireRole('ADMIN'));

router.post('/',                       validate(createUserSchema), ctrl.create);
router.get('/',                                                    ctrl.list);
router.get('/:id',                                                 ctrl.get);
router.patch('/:id/change-role',       validate(changeRoleSchema), ctrl.changeRole);
router.patch('/:id/deactivate',                                    ctrl.deactivate);
router.patch('/:id/activate',                                      ctrl.activate);
router.patch('/:id/reset-password',                                ctrl.resetPassword);
router.delete('/:id',                                              ctrl.remove);

module.exports = router;
