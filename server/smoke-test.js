// End-to-end API smoke test. Start the server first, then:  npm run smoke --prefix server
// Uses ADMIN_EMAIL / ADMIN_PASSWORD from server/.env (the seeded admin) and creates a temporary user + book.
import './config/env.js';

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
let passed = 0, failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name} ${extra}`); }
}

const stamp = Date.now();
const userEmail = `reader${stamp}@example.com`;
const address = { fullName: 'Test Reader', phone: '0123456789', address: '12 Library Road', city: 'Cairo', postalCode: '11511' };

console.log(`Smoke test against ${BASE}`);
let r = await call('GET', '/api/health');
check('health is ok and database connected', r.status === 200 && r.data.database === 'connected');

r = await call('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
check('admin can log in', r.status === 200 && r.data.user?.role === 'admin' && !('password' in r.data.user));
const admin = r.data.token;
r = await call('POST', '/api/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: 'wrong-password' } });
check('wrong password is rejected (401)', r.status === 401);

r = await call('POST', '/api/auth/register', { body: { name: 'Test Reader', email: userEmail, password: 'password123', role: 'admin' } });
check('registration works and ignores a client-sent role', r.status === 201 && r.data.user.role === 'user' && !('password' in r.data.user));
const user = r.data.token;
r = await call('POST', '/api/auth/register', { body: { name: 'Dup', email: userEmail, password: 'password123' } });
check('duplicate email is rejected (409)', r.status === 409);
r = await call('POST', '/api/auth/register', { body: { name: 'X', email: 'bad', password: '1' } });
check('invalid registration is rejected (400)', r.status === 400);
r = await call('GET', '/api/auth/me', { token: user });
check('/me returns current user', r.status === 200 && r.data.user.email === userEmail);

r = await call('GET', '/api/books?limit=5');
check('visitors can list books', r.status === 200 && r.data.books.length > 0 && r.data.total >= 20);
r = await call('GET', '/api/books?search=orwell');
check('search by author works', r.data.books?.length >= 1 && r.data.books.every((b) => /orwell/i.test(b.author)));
r = await call('GET', '/api/books?category=Technology&sort=price_asc');
const prices = r.data.books.map((b) => b.price);
check('category filter + price sort work', prices.length >= 2 && prices.every((p, i) => i === 0 || p >= prices[i - 1]));
r = await call('GET', '/api/books?search=%5B%28');
check('regex characters in search do not crash', r.status === 200);
r = await call('GET', '/api/books/categories');
check('categories endpoint works', r.status === 200 && r.data.categories.includes('Classics'));
r = await call('GET', '/api/books/not-an-id');
check('invalid book id returns 400', r.status === 400);

const book = { title: `Smoke Test Book ${stamp}`, author: 'Test Author', description: 'A book created by the smoke test.', price: 20, category: 'Testing', coverUrl: '', stock: 5, isbn: '' };
r = await call('POST', '/api/books', { token: user, body: book });
check('regular user cannot create a book (403)', r.status === 403);
r = await call('POST', '/api/books', { body: book });
check('anonymous cannot create a book (401)', r.status === 401);
r = await call('POST', '/api/books', { token: admin, body: { ...book, price: -5 } });
check('negative price is rejected (400)', r.status === 400);
r = await call('POST', '/api/books', { token: admin, body: { ...book, stock: 1.5 } });
check('fractional stock is rejected (400)', r.status === 400);
r = await call('POST', '/api/books', { token: admin, body: book });
check('admin can create a book', r.status === 201 && r.data.book._id);
const id = r.data.book._id;
r = await call('PUT', `/api/books/${id}`, { token: admin, body: { ...book, price: 25, stock: 4 } });
check('admin can edit a book', r.status === 200 && r.data.book.price === 25 && r.data.book.stock === 4);
r = await call('PUT', `/api/books/${id}`, { token: user, body: book });
check('regular user cannot edit a book (403)', r.status === 403);

r = await call('POST', '/api/orders', { body: { items: [{ bookId: id, quantity: 1 }], shippingAddress: address } });
check('checkout requires login (401)', r.status === 401);
r = await call('POST', '/api/orders', { token: user, body: { items: [{ bookId: id, quantity: 9 }], shippingAddress: address } });
check('order above available stock is rejected (409)', r.status === 409);
r = await call('GET', `/api/books/${id}`);
check('failed order did not change stock', r.data.book.stock === 4);
r = await call('POST', '/api/orders', { token: user, body: { items: [{ bookId: id, quantity: 2, price: 0.01 }], shippingAddress: address } });
check('order is created and the server ignores a client price', r.status === 201 && r.data.order.total === 50 && r.data.order.items[0].price === 25);
const orderId = r.data.order._id;
r = await call('GET', `/api/books/${id}`);
check('stock is reduced after an order', r.data.book.stock === 2);
r = await call('POST', '/api/orders', { token: user, body: { items: [{ bookId: id, quantity: 1 }, { bookId: '0123456789abcdef01234567', quantity: 1 }], shippingAddress: address } });
check('order with a missing book fails and stock is untouched', r.status === 404 && (await call('GET', `/api/books/${id}`)).data.book.stock === 2);
// Two simultaneous orders for the last 2 copies: exactly one may win.
const both = await Promise.all([1, 2].map(() => call('POST', '/api/orders', { token: user, body: { items: [{ bookId: id, quantity: 2 }], shippingAddress: address } })));
const wins = both.filter((x) => x.status === 201).length;
check('concurrent orders cannot oversell (exactly 1 succeeds)', wins === 1 && (await call('GET', `/api/books/${id}`)).data.book.stock === 0);

r = await call('GET', '/api/orders/mine', { token: user });
check('user sees their own order history', r.status === 200 && r.data.orders.length === 2);
r = await call('GET', `/api/orders/${orderId}`, { token: user });
check('user can open their order', r.status === 200 && r.data.order._id === orderId);
r = await call('GET', '/api/orders', { token: user });
check('user cannot list all orders (403)', r.status === 403);
r = await call('GET', '/api/orders', { token: admin });
check('admin can list all orders', r.status === 200 && r.data.orders.length >= 2 && r.data.orders[0].user?.email);
r = await call('GET', '/api/users', { token: user });
check('user cannot list users (403)', r.status === 403);
r = await call('GET', '/api/users', { token: admin });
check('admin can list users without password hashes', r.status === 200 && r.data.users.length >= 2 && r.data.users.every((u) => !('password' in u)));
r = await call('GET', '/api/admin/stats', { token: user });
check('user cannot read admin stats (403)', r.status === 403);
r = await call('GET', '/api/admin/stats', { token: admin });
check('admin stats come from the database', r.status === 200 && r.data.stats.totalBooks >= 21 && r.data.stats.totalOrders >= 2 && r.data.stats.totalSales >= 50);

r = await call('PATCH', `/api/orders/${orderId}/status`, { token: admin, body: { status: 'cancelled' } });
check('admin cancels an order', r.status === 200 && r.data.order.status === 'cancelled');
r = await call('PATCH', `/api/orders/${orderId}/status`, { token: admin, body: { status: 'cancelled' } });
r = await call('GET', `/api/books/${id}`);
check('cancelling restocks exactly once', r.data.book.stock === 2);

r = await call('DELETE', `/api/books/${id}`, { token: user });
check('regular user cannot delete a book (403)', r.status === 403);
r = await call('DELETE', `/api/books/${id}`, { token: admin });
check('admin can delete a book', r.status === 200);
r = await call('GET', `/api/books/${id}`);
check('deleted book returns 404', r.status === 404);
r = await call('GET', '/api/nope');
check('unknown API route returns JSON 404', r.status === 404 && r.data.success === false);

const me = (await call('GET', '/api/auth/me', { token: user })).data.user;
r = await call('DELETE', `/api/users/${me._id}`, { token: admin });
check('admin can delete the temporary user', r.status === 200);
r = await call('GET', '/api/auth/me', { token: user });
check('deleted user token stops working (401)', r.status === 401);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
