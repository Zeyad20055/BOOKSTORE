import { ApiError } from '../utils/ApiError.js';

/** Tiny in-memory limiter (per IP) for login/register. Use a shared store if you run several servers. */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
  }, windowMs).unref();

  return (req, _res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || entry.reset < now) hits.set(key, { count: 1, reset: now + windowMs });
    else if (++entry.count > max) throw new ApiError(429, 'Too many attempts. Please try again later');
    next();
  };
}
