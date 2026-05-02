const { Router } = require('express');
const prisma = require('../../config/prisma');

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Auth — fully implemented (Phase 1)
router.use('/auth', require('./auth/auth.routes'));

// Skeletons — fill in as each module owner implements their slice
router.use('/users',            require('./users/users.routes'));
router.use('/employees',        require('./employees/employees.routes'));
router.use('/attendance',       require('./attendance/attendance.routes'));
router.use('/leave',            require('./leave/leave.routes'));
router.use('/settings',         require('./settings/settings.routes'));

// Unified Payroll Module (Phase 2)
router.use('/', require('../payrollRoutes'));

module.exports = router;
