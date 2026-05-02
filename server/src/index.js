const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const prisma = require('./config/prisma');
const apiV1 = require('./api/v1');

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

// Liveness probe (no DB) — for load balancers / uptime checks
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', apiV1);

const server = app.listen(env.port, () => {
  console.log(`[empay] server listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

const shutdown = async (signal) => {
  console.log(`\n[empay] ${signal} received, shutting down...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
