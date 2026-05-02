// Trigger restart
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const prisma = require('./config/prisma');
const apiV1 = require('./api/v1');
const { ensureBootstrapAdmin } = require('./utils/bootstrap');

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

// Liveness probe (no DB) — for load balancers / uptime checks
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', apiV1);

// Centralised error handler — controllers call next(err) with optional err.status
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const server = app.listen(env.port, async () => {
  console.log(`[empay] server listening on http://localhost:${env.port} (${env.nodeEnv})`);
  // Self-heal: re-create a default admin if the DB has been wiped.
  await ensureBootstrapAdmin();
});

const shutdown = async (signal) => {
  console.log(`\n[empay] ${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
