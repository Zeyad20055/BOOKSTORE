import User from '../models/User.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { assertId, escapeRegex } from '../utils/validate.js';

export async function listUsers(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const rx = new RegExp(escapeRegex(req.query.search.trim().slice(0, 80)), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
}

export async function getUser(req, res) {
  assertId(req.params.id, 'user id');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const orderCount = await Order.countDocuments({ user: user._id });
  res.json({ success: true, user, orderCount });
}

export async function updateUserRole(req, res) {
  assertId(req.params.id, 'user id');
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) throw new ApiError(400, 'Role must be "user" or "admin"');
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot change your own role');
  const { matchedCount } = await User.updateOne({ _id: req.params.id }, { role });
  if (!matchedCount) throw new ApiError(404, 'User not found');
  res.json({ success: true, user: await User.findById(req.params.id) });
}

export async function deleteUser(req, res) {
  assertId(req.params.id, 'user id');
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot delete your own account');
  const { deletedCount } = await User.deleteOne({ _id: req.params.id });
  if (!deletedCount) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User deleted' });
}
