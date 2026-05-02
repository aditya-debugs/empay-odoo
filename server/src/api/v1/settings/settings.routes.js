const { Router } = require('express');
const ctrl = require('./settings.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const { updateSettingsSchema } = require('./settings.validation');

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/',  ctrl.get);
router.patch('/', validate(updateSettingsSchema), ctrl.update);

module.exports = router;
