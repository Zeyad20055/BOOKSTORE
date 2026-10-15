import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export const isValidId = (id) => typeof id === 'string' && mongoose.isValidObjectId(id) && id.length === 24;

export function assertId(id, label = 'id') {
  if (!isValidId(id)) throw new ApiError(400, `Invalid ${label}`);
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Throws a 400 carrying a field -> message map when anything is wrong. */
function fail(errors) {
  if (Object.keys(errors).length) throw new ApiError(400, Object.values(errors)[0], errors);
}

export function validateRegister(body = {}) {
  const errors = {};
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (name.length < 2 || name.length > 60) errors.name = 'Name must be 2 to 60 characters';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (password.length < 8 || password.length > 72) errors.password = 'Password must be 8 to 72 characters';
  fail(errors);
  return { name, email, password }; // the role is deliberately never read from the client
}

export function validateLogin(body = {}) {
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!EMAIL_RE.test(email) || !password) throw new ApiError(400, 'Email and password are required');
  return { email, password };
}

export function validateBook(body = {}, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const has = (k) => body[k] !== undefined;

  const text = (key, label, min, max) => {
    if (!has(key)) {
      if (!partial) errors[key] = `${label} is required`;
      return;
    }
    const v = str(body[key]);
    if (v.length < min) errors[key] = `${label} must be at least ${min} character${min > 1 ? 's' : ''}`;
    else if (v.length > max) errors[key] = `${label} must be at most ${max} characters`;
    else out[key] = v;
  };
  text('title', 'Title', 1, 200);
  text('author', 'Author', 1, 120);
  text('description', 'Description', 10, 3000);
  text('category', 'Category', 2, 60);

  if (has('price') || !partial) {
    const price = Number(body.price);
    if (body.price === '' || body.price == null || !Number.isFinite(price)) errors.price = 'Price is required and must be a number';
    else if (price < 0) errors.price = 'Price cannot be negative';
    else if (price > 100000) errors.price = 'Price is too high';
    else out.price = Math.round(price * 100) / 100;
  }
  if (has('stock') || !partial) {
    const stock = Number(body.stock);
    if (body.stock === '' || body.stock == null || !Number.isInteger(stock)) errors.stock = 'Stock must be a whole number';
    else if (stock < 0) errors.stock = 'Stock cannot be negative';
    else if (stock > 1000000) errors.stock = 'Stock is too high';
    else out.stock = stock;
  }
  if (has('coverUrl')) {
    const url = str(body.coverUrl);
    if (url && !/^https?:\/\/\S+$/i.test(url)) errors.coverUrl = 'Cover image must be a valid http(s) URL';
    else out.coverUrl = url;
  }
  if (has('isbn')) {
    const isbn = str(body.isbn).replace(/[-\s]/g, '');
    if (isbn && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) errors.isbn = 'ISBN must be 10 or 13 digits';
    else out.isbn = isbn;
  }
  fail(errors);
  return out;
}

export function validateOrder(body = {}) {
  if (!Array.isArray(body.items) || body.items.length === 0) throw new ApiError(400, 'Your cart is empty');
  if (body.items.length > 50) throw new ApiError(400, 'Too many different items in one order');

  // Merge duplicates so the same book is only checked and decremented once.
  const merged = new Map();
  for (const item of body.items) {
    const bookId = item?.bookId;
    const qty = Number(item?.quantity);
    if (!isValidId(bookId)) throw new ApiError(400, 'One of the items has an invalid book id');
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new ApiError(400, 'Quantity must be a whole number between 1 and 99');
    merged.set(bookId, (merged.get(bookId) || 0) + qty);
  }

  const s = body.shippingAddress || {};
  const shippingAddress = {
    fullName: str(s.fullName), phone: str(s.phone), address: str(s.address),
    city: str(s.city), postalCode: str(s.postalCode),
  };
  const errors = {};
  if (shippingAddress.fullName.length < 2) errors.fullName = 'Full name is required';
  if (shippingAddress.phone.length < 6) errors.phone = 'Enter a phone number';
  if (shippingAddress.address.length < 5) errors.address = 'Enter a street address';
  if (shippingAddress.city.length < 2) errors.city = 'City is required';
  if (Object.values(shippingAddress).some((v) => v.length > 200)) errors.address = 'One of the address fields is too long';
  fail(errors);

  return {
    items: [...merged].map(([bookId, quantity]) => ({ bookId, quantity })),
    shippingAddress,
  };
}

/** Escape user input before using it inside a RegExp. */
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
