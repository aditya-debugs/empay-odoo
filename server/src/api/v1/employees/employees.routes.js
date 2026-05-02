const { Router } = require('express');
const ctrl = require('./employees.controller');
const { requireAuth } = require('../../../middleware/auth');

const router = Router();

// GET / — List employees with search/filter
router.get('/', requireAuth, ctrl.listEmployees);

// GET /:id — Get employee profile
router.get('/:id', requireAuth, ctrl.getEmployee);

// PATCH /profile — Update own profile
router.patch('/profile', requireAuth, ctrl.updateProfile);

// PATCH /bank-details — Update own bank details
router.patch('/bank-details', requireAuth, ctrl.updateBankDetails);

module.exports = router;
