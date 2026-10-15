import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { validateRegister, validateLogin } from '../utils/validate.js';

const signToken = (user) => jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export async function register(req, res) {
  const { name, email, password } = validateRegister(req.body);
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  // Public registration can only ever create regular users.
  const user = await User.create({ name, email, password, role: 'user' });
  res.status(201).json({ success: true, token: signToken(user), user });
}

export async function login(req, res) {
  const { email, password } = validateLogin(req.body);
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password.
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Incorrect email or password');
  res.json({ success: true, token: signToken(user), user });
}

export function me(req, res) {
  res.json({ success: true, user: req.user });
}
