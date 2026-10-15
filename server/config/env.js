// Loads server/.env (relative to this file, so it works from any working directory).
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true, override: false });
}

const PLACEHOLDER_SECRET = 'replace_with_a_long_random_secret';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || (
    process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/book_store'
  ),
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

export function assertEnv() {
  if (!env.MONGODB_URI) {
    console.error('\n[config] MONGODB_URI is missing. Set it to your MongoDB Atlas connection string in the deployment environment.\n');
    process.exit(1);
  }

  const secret = env.JWT_SECRET;
  if (!secret) {
    console.error('\n[config] JWT_SECRET is missing. Run "npm run setup" at the project root or set it in server/.env\n');
    process.exit(1);
  }
  if (secret === PLACEHOLDER_SECRET || secret.length < 16) {
    if (env.NODE_ENV === 'production') {
      console.error('\n[config] JWT_SECRET is a placeholder or too short. Set a long random value before running in production.\n');
      process.exit(1);
    }
    console.warn('[config] Warning: JWT_SECRET looks like a placeholder. Fine for local dev, never for production.');
  }
}
