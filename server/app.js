import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { isDbReady } from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { ApiError } from './utils/ApiError.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs behind a hosting proxy (rate limiting)

// CORS: the Vite proxy makes dev requests same-origin; this matters for a separately hosted front-end.
const allowed = env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.get('/api/health', (_req, res) => {
  const db = isDbReady();
  res.status(db ? 200 : 503).json({
    success: db,
    status: db ? 'ok' : 'degraded',
    database: db ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

// Data routes need the database; answer clearly instead of hanging when it is down.
app.use('/api', (_req, _res, next) => {
  if (!isDbReady()) throw new ApiError(503, 'The database is not available right now. Please try again shortly');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', notFound);

// Production: serve the built React app from the same server (single deployment).
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

export default app;
