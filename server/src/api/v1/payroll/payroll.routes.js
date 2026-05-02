const { Router } = require('express');
const ctrl = require('./payroll.controller');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const { processSchema } = require('./payroll.validation');

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'PAYROLL_OFFICER'));

// Preview accepts both GET (no adjustments) and POST (with adjustments) for convenience.
router.get('/preview',           ctrl.preview);
router.post('/preview',          ctrl.preview);

router.post('/process',          validate(processSchema), ctrl.process);

router.get('/runs',              ctrl.listRuns);
router.get('/:year/:month',      ctrl.getRun);

module.exports = router;
