// Creates server/.env from server/.env.example with a fresh random JWT_SECRET (only if it does not exist yet).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'server', '.env.example');
const target = path.join(root, 'server', '.env');

if (fs.existsSync(target)) {
  console.log('[setup] server/.env already exists, leaving it untouched.');
} else if (fs.existsSync(example)) {
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(target, fs.readFileSync(example, 'utf8').replace('replace_with_a_long_random_secret', secret));
  console.log('[setup] Created server/.env with a random JWT_SECRET. Open it to review MONGODB_URI and the ADMIN_* values.');
}
