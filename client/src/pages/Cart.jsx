import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import BookCover from '../components/BookCover';
import QuantityControl from '../components/QuantityControl';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function Cart() {
  const { t } = useLanguage();
  useDocumentTitle(t('Your cart'));
  const { items, count, subtotal, total, setQuantity, removeItem, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Pull fresh prices and stock whenever the cart page opens.
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  if (items.length === 0) {
    return (
      <div className="container page">
        <EmptyState icon={ShoppingBag} title={t('Your cart is empty')} action={<Link to="/books" className="btn btn-dark">{t('Find a book')}</Link>}>
          {t('Books you add will wait for you here.')}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page-head"><h1>{t('Your cart')}</h1><p>{t(count === 1 ? '{count} item' : '{count} items', { count })}</p></header>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((i) => (
            <li key={i.bookId} className="cart-item">
              <Link to={`/books/${i.bookId}`} className="cart-cover"><BookCover book={i} /></Link>
              <div className="cart-info">
                <h3><Link to={`/books/${i.bookId}`}>{i.title}</Link></h3>
                <p>{i.author}</p>
                <p className="muted">{formatPrice(i.price)} {t('each')}</p>
                {i.quantity >= i.stock && <p className="stock stock-low">{t('Maximum available quantity')}</p>}
              </div>
              <QuantityControl value={i.quantity} max={i.stock} onChange={(q) => setQuantity(i.bookId, q)} label={t('Quantity for {title}', { title: i.title })} />
              <strong className="cart-line">{formatPrice(i.price * i.quantity)}</strong>
              <button className="icon-btn" onClick={() => removeItem(i.bookId)} aria-label={t('Remove {title} from cart', { title: i.title })}><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>{t('Order summary')}</h2>
          <dl>
            <div><dt>{t('Subtotal')}</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div><dt>{t('Shipping')}</dt><dd>{t('Included')}</dd></div>
            <div className="summary-total"><dt>{t('Total')}</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          <button className="btn btn-dark btn-block" onClick={() => navigate('/checkout')}>
            {user ? t('Go to checkout') : t('Log in to check out')}
          </button>
          <p className="note">{t('Online payments are not integrated. You pay when the order arrives.')}</p>
        </aside>
      </div>
    </div>
  );
}
