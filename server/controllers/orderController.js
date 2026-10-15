import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { ApiError } from '../utils/ApiError.js';
import { assertId, validateOrder } from '../utils/validate.js';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

/**
 * Creates an order. The client only sends book ids + quantities; names and prices
 * are always read from the database. Stock is reduced with an atomic conditional
 * update per book ("only if stock >= quantity"), so two buyers can never oversell
 * the last copy. If any step fails, the stock already taken is put back.
 */
export async function createOrder(req, res) {
  const { items, shippingAddress } = validateOrder(req.body);

  const books = await Book.find({ _id: { $in: items.map((i) => i.bookId) } });
  const byId = new Map(books.map((b) => [String(b._id), b]));
  for (const item of items) {
    const book = byId.get(item.bookId);
    if (!book) throw new ApiError(404, 'One of the books in your cart is no longer available');
  }

  const reserved = [];
  const rollback = () => Promise.all(reserved.map((r) => Book.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));

  try {
    const lines = [];
    for (const item of items) {
      const taken = await Book.findOneAndUpdate(
        { _id: item.bookId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!taken) {
        const book = byId.get(item.bookId);
        const left = (await Book.findById(item.bookId))?.stock ?? 0;
        throw new ApiError(409, left > 0
          ? `Only ${left} cop${left === 1 ? 'y' : 'ies'} of "${book.title}" left in stock`
          : `"${book.title}" is out of stock`);
      }
      reserved.push({ id: item.bookId, qty: item.quantity });
      lines.push({ book: taken._id, title: taken.title, author: taken.author, coverUrl: taken.coverUrl, price: taken.price, quantity: item.quantity });
    }

    const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;
    const order = await Order.create({ user: req.user._id, items: lines, total, shippingAddress });
    res.status(201).json({ success: true, order });
  } catch (err) {
    await rollback();
    throw err;
  }
}

export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
}

export async function getOrder(req, res) {
  assertId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  // Same 404 for "missing" and "not yours" so ids can't be probed.
  const ownerId = order?.user?._id ?? order?.user;
  if (!order || (req.user.role !== 'admin' && String(ownerId) !== String(req.user._id))) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
}

export async function listAllOrders(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
}

export async function updateOrderStatus(req, res) {
  assertId(req.params.id, 'order id');
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw new ApiError(400, `Status must be one of: ${STATUSES.join(', ')}`);

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === status) return res.json({ success: true, order });
  if (order.status === 'cancelled') throw new ApiError(409, 'A cancelled order cannot be reopened');

  if (status === 'cancelled') {
    // The conditional update guarantees stock is returned only once, even on double clicks.
    const changed = await Order.findOneAndUpdate({ _id: order._id, status: { $ne: 'cancelled' } }, { status }, { new: true });
    if (changed) await Promise.all(order.items.map((i) => Book.updateOne({ _id: i.book }, { $inc: { stock: i.quantity } })));
    return res.json({ success: true, order: changed || order });
  }
  order.status = status;
  await order.save();
  res.json({ success: true, order });
}
