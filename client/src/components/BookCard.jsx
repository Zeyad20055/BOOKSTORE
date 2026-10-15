import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import BookCover from './BookCover';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { useEffect, useRef, useState } from 'react';

export default function BookCard({ book }) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const out = book.stock < 1;
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = cardRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={cardRef} className={`book-card reveal ${visible ? 'is-visible' : ''}`}>
      <Link to={`/books/${book._id}`} className="book-card-cover" aria-label={t('View {title}', { title: book.title })}>
        <BookCover book={book} />
      </Link>
      <div className="book-card-body">
        <h3 className="book-card-title"><Link to={`/books/${book._id}`}>{book.title}</Link></h3>
        <p className="book-card-author">{book.author}</p>
        <span className="book-category">{t(book.category)}</span>
        <div className="book-card-meta">
          <strong className="price">{formatPrice(book.price)}</strong>
          {out ? <span className="stock stock-out">{t('Out of stock')}</span>
            : book.stock <= 5 ? <span className="stock stock-low">{t('Only {count} left', { count: book.stock })}</span> : null}
        </div>
        <button className="btn btn-dark btn-sm" disabled={out} onClick={() => addItem(book)}>
          <ShoppingBag size={16} aria-hidden="true" /> {out ? t('Unavailable') : t('Add to cart')}
        </button>
      </div>
    </article>
  );
}
