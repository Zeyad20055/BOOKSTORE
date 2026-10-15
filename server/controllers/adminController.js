import Book from '../models/Book.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

const LOW_STOCK = 5;

/** Real numbers straight from the database (cancelled orders are excluded from sales). */
export async function getStats(_req, res) {
  const [totalBooks, totalUsers, totalOrders, lowStock, outOfStock, sales, recentOrders] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    Order.countDocuments(),
    Book.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK } }),
    Book.countDocuments({ stock: 0 }),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
  ]);
  res.json({
    success: true,
    stats: { totalBooks, totalUsers, totalOrders, totalSales: Math.round((sales[0]?.total || 0) * 100) / 100, lowStock, outOfStock, lowStockThreshold: LOW_STOCK },
    recentOrders,
  });
}
