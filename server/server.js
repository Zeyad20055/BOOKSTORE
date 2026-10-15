import { env, assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';
import app from './app.js';

assertEnv();

const server = app.listen(env.PORT, () => {
  console.log(`\n[server] Book Store API running on http://localhost:${env.PORT}  (${env.NODE_ENV})`);
  console.log(`[server] Health check: http://localhost:${env.PORT}/api/health`);
  connectDB();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`\n[server] Port ${env.PORT} is already in use. Stop the other process or change PORT in server/.env\n`);
  else console.error('[server] Failed to start:', err.message);
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down...`);
  server.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => console.error('[server] Unhandled rejection:', reason));
