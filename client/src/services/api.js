import axios from 'axios';

const TOKEN_KEY = 'bookstore:token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

// In development Vite proxies /api to Express. For a separately hosted front-end set VITE_API_URL at build time.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // An expired or invalid session: tell the app to log out (login/register failures are not session errors).
    if (err.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register') && tokenStore.get()) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

/** Turns any axios error into a message that is safe to show to people. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (err?.request && !err.response) return 'Cannot reach the server. Check that the API is running.';
  return fallback;
}

/** Field-level validation messages returned by the API, if any. */
export const fieldErrors = (err) => err?.response?.data?.errors || {};

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.user),
};

export const bookApi = {
  list: (params) => api.get('/books', { params }).then((r) => r.data),
  categories: () => api.get('/books/categories').then((r) => r.data.categories),
  get: (id) => api.get(`/books/${id}`).then((r) => r.data.book),
  create: (data) => api.post('/books', data).then((r) => r.data.book),
  update: (id, data) => api.put(`/books/${id}`, data).then((r) => r.data.book),
  remove: (id) => api.delete(`/books/${id}`).then((r) => r.data),
};

export const orderApi = {
  create: (data) => api.post('/orders', data).then((r) => r.data.order),
  mine: () => api.get('/orders/mine').then((r) => r.data.orders),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.order),
  all: (params) => api.get('/orders', { params }).then((r) => r.data),
  setStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((r) => r.data.order),
};

export const userApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data.user),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
};

export default api;
