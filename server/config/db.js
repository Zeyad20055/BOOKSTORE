import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

let retryTimer = null;

/** True while the MongoDB connection is open. */
export const isDbReady = () => mongoose.connection.readyState === 1;

/**
 * Connects to MongoDB. If the database is unreachable the API keeps running,
 * reports the problem on /api/health, answers 503 on data routes, and retries.
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    const errorCode = typeof err?.code === 'string' && /^[A-Z0-9_]+$/.test(err.code)
      ? ` (${err.code})`
      : '';
    console.error(`[db] MongoDB connection failed: ${errorName}${errorCode}.`);
    console.error('[db] The API remains available with database-dependent routes returning 503. Retrying in 5s...');
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { void connectDB(); }, 5000);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));
