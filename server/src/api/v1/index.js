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

// Mount feature routers below as you build them:
// router.use('/auth', require('./auth/auth.routes'));
// router.use('/employees', require('./employees/employees.routes'));

module.exports = router;
