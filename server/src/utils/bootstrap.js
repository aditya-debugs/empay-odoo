const prisma = require('../config/prisma');
const { hashPassword } = require('./password');

/**
 * Self-healing safety net.
 * On every server start, ensures at least one ADMIN exists. If the DB has
 * been wiped (intentionally or otherwise), this re-creates a default admin
 * so you always have a way back in.
 *
 * Configuration via .env:
 *   BOOTSTRAP_ADMIN_EMAIL    (default: admin@empay.local)
 *   BOOTSTRAP_ADMIN_PASSWORD (default: admin12345)
 *   BOOTSTRAP_ADMIN_NAME     (default: Bootstrap Admin)
 *
 * Idempotent — if any admin user already exists, this is a no-op.
 */
async function ensureBootstrapAdmin() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) return { created: false, count: adminCount };

    const email = process.env.BOOTSTRAP_ADMIN_EMAIL    || 'admin@empay.local';
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin12345';
    const name = process.env.BOOTSTRAP_ADMIN_NAME     || 'Bootstrap Admin';

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'ADMIN',
        companyName: 'EmPay',
        isActive: true,
        mustChangePassword: false,
      },
    });

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  [bootstrap] No admin found — created default admin.       ║');
    console.log('║                                                            ║');
    console.log(`║   Email:    ${email.padEnd(46)} ║`);
    console.log(`║   Password: ${password.padEnd(46)} ║`);
    console.log('║                                                            ║');
    console.log('║  Override via BOOTSTRAP_ADMIN_EMAIL/PASSWORD in .env       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    return { created: true };
  } catch (err) {
    console.error('[bootstrap] Failed to ensure admin user:', err.message);
    return { created: false, error: err.message };
  }
}

module.exports = { ensureBootstrapAdmin };
