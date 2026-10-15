import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** Requires a valid "Authorization: Bearer <token>" header and loads the user from the DB. */
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Your session expired. Please log in again' : 'Invalid session. Please log in again');
  }

  // Role is always read fresh from the database, never from the token or the client.
  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'This account no longer exists');
  req.user = user;
  next();
}

/** Use after protect(). Only lets admins through. */
export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Administrator access required');
  next();
}
