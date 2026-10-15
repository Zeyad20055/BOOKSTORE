import Book from '../models/Book.js';
import { ApiError } from '../utils/ApiError.js';
import { assertId, isValidId, validateBook, escapeRegex } from '../utils/validate.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  title: { title: 1, _id: 1 },
};

export async function listBooks(req, res) {
  const { search, category, sort = 'newest', ids } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

  const filter = {};
  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
    filter.$or = [{ title: rx }, { author: rx }];
  }
  if (typeof category === 'string' && category.trim() && category !== 'all') filter.category = category.trim();
  if (typeof ids === 'string' && ids) {
    const list = ids.split(',').filter(isValidId).slice(0, 100);
    filter._id = { $in: list };
  }

  const [books, total] = await Promise.all([
    Book.find(filter).sort(SORTS[sort] || SORTS.newest).skip((page - 1) * limit).limit(limit),
    Book.countDocuments(filter),
  ]);
  res.json({ success: true, books, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
}

export async function listCategories(_req, res) {
  const categories = (await Book.distinct('category')).sort((a, b) => a.localeCompare(b));
  res.json({ success: true, categories });
}

export async function getBook(req, res) {
  assertId(req.params.id, 'book id');
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');
  res.json({ success: true, book });
}

export async function createBook(req, res) {
  const book = await Book.create(validateBook(req.body));
  res.status(201).json({ success: true, book });
}

export async function updateBook(req, res) {
  assertId(req.params.id, 'book id');
  const data = validateBook(req.body);
  const book = await Book.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!book) throw new ApiError(404, 'Book not found');
  res.json({ success: true, book });
}

export async function deleteBook(req, res) {
  assertId(req.params.id, 'book id');
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');
  res.json({ success: true, message: 'Book deleted' });
}
