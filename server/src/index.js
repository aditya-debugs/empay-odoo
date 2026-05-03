const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const prisma = require('./config/prisma');
const apiV1 = require('./api/v1');
const { ensureBootstrapAdmin } = require('./utils/bootstrap');

const path = require('path');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const corsOrigin = env.nodeEnv === 'development'
  ? (origin, cb) => cb(null, true)  // allow any origin in dev (Vite port changes on restart)
  : env.clientUrl;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Debug log for CORS
console.log(`[CORS] Configuring with origin: ${env.clientUrl}`);

app.use(cors({ 
  origin: env.clientUrl.includes(',') ? env.clientUrl.split(',') : env.clientUrl, 
  credentials: true 
}));

app.use(express.json());

// Liveness probe
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', apiV1);

// Centralised error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const server = app.listen(env.port, async () => {
  console.log(`[empay] server listening on http://localhost:${env.port} (${env.nodeEnv})`);
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
