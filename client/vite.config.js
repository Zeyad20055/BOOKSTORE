import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Read PORT from server/.env so the dev proxy always follows the API port.
function apiPort() {
  try {
    const env = fs.readFileSync(path.resolve(here, '../server/.env'), 'utf8');
    const match = env.match(/^\s*PORT\s*=\s*(\d+)/m);
    if (match) return match[1];
  } catch { /* no .env yet: fall back to the default */ }
  return '5000';
}

const target = process.env.VITE_API_TARGET || `http://localhost:${apiPort()}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Browser calls /api/... on port 5173 and Vite forwards them to Express: no CORS needed in development.
    proxy: { '/api': { target, changeOrigin: true } },
  },
});
