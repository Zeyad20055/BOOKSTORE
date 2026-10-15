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
    console.error(`[db] Could not connect to MongoDB at ${redact(env.MONGODB_URI)}`);
    console.error(`[db] ${err.message}`);
    console.error('[db] Start a local MongoDB or set MONGODB_URI to a MongoDB Atlas string in server/.env. Retrying in 5s...');
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connectDB, 5000);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));

// Hide credentials when printing a connection string.
function redact(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@]+)@/, '//$1:****@');
}
