import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { bookApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

const CartContext = createContext(null);
const keyFor = (user) => `bookstore:cart:${user?._id || 'guest'}`;

function read(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items.filter((i) => i?.bookId && i.quantity > 0) : [];
  } catch { return []; }
}
function write(key, items) {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* storage unavailable */ }
}

const snapshot = (b) => ({ title: b.title, author: b.author, price: b.price, coverUrl: b.coverUrl, stock: b.stock });

/**
 * The cart lives in localStorage, one cart per signed-in user (plus a guest cart).
 * Prices shown here are only for display: the server recalculates everything at checkout.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const key = keyFor(user);
  const [items, setItems] = useState(() => read(key));
  const activeKey = useRef(key);

  // Declared first on purpose: it must run before the key-switch effect below.
  useEffect(() => {
    if (activeKey.current === key) write(key, items);
  }, [items, key]);

  useEffect(() => {
    if (activeKey.current === key) return;
    const wasGuest = activeKey.current.endsWith(':guest');
    let next = read(key);
    if (wasGuest && user) {
      // Signing in: merge what the visitor collected into the account's saved cart.
      const merged = new Map(next.map((i) => [i.bookId, { ...i }]));
      for (const g of items) {
        const existing = merged.get(g.bookId);
        if (existing) existing.quantity = Math.min(existing.quantity + g.quantity, g.stock || 99);
        else merged.set(g.bookId, g);
      }
      next = [...merged.values()];
      try { localStorage.removeItem(activeKey.current); } catch { /* ignore */ }
    }
    activeKey.current = key;
    setItems(next);
  }, [key, user, items]);

  // Mutators read the latest items from a ref so they can decide synchronously (and toast once).
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const commit = (next) => { itemsRef.current = next; setItems(next); };

  const addItem = useCallback((book, quantity = 1) => {
    if (book.stock < 1) { toast.error(t('"{title}" is out of stock', { title: book.title })); return false; }
    const prev = itemsRef.current;
    const existing = prev.find((i) => i.bookId === book._id);
    const current = existing?.quantity || 0;
    const nextQty = Math.min(current + quantity, book.stock);
    if (nextQty === current) {
      toast.info(t('You already have all {count} available copies in your cart', { count: book.stock }));
      return false;
    }
    commit(existing
      ? prev.map((i) => (i.bookId === book._id ? { ...i, ...snapshot(book), quantity: nextQty } : i))
      : [...prev, { bookId: book._id, quantity: nextQty, ...snapshot(book) }]);
    toast.success(t('Added "{title}" to your cart', { title: book.title }));
    return true;
  }, [toast, t]);

  const setQuantity = useCallback((bookId, quantity) => {
    commit(itemsRef.current.flatMap((i) => {
      if (i.bookId !== bookId) return [i];
      const q = Math.min(Math.max(quantity, 0), i.stock || 99);
      return q === 0 ? [] : [{ ...i, quantity: q }];
    }));
  }, []);

  const removeItem = useCallback((bookId) => commit(itemsRef.current.filter((i) => i.bookId !== bookId)), []);
  const clear = useCallback(() => commit([]), []);

  /** Re-reads prices and stock from the server; drops deleted books and trims quantities to current stock. */
  const refresh = useCallback(async () => {
    if (!items.length) return;
    try {
      const { books } = await bookApi.list({ ids: items.map((i) => i.bookId).join(','), limit: 100 });
      const byId = new Map(books.map((b) => [b._id, b]));
      commit(itemsRef.current.flatMap((i) => {
        const b = byId.get(i.bookId);
        if (!b || b.stock < 1) return [];
        return [{ ...i, ...snapshot(b), quantity: Math.min(i.quantity, b.stock) }];
      }));
    } catch { /* offline: keep showing the saved cart */ }
  }, [items]);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    return { items, count, subtotal, total: subtotal, addItem, setQuantity, removeItem, clear, refresh };
  }, [items, addItem, setQuantity, removeItem, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
