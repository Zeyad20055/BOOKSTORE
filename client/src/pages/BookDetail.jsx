import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import BookCover from '../components/BookCover';
import BookCard from '../components/BookCard';
import QuantityControl from '../components/QuantityControl';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import useFetch from '../hooks/useFetch';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import { bookApi } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function BookDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const { data: book, loading, error, reload } = useFetch(() => bookApi.get(id), [id]);
  const related = useFetch(async () => {
    if (!book) return [];
    const { books } = await bookApi.list({ category: book.category, limit: 5 });
    return books.filter((b) => b._id !== book._id).slice(0, 4);
  }, [book?._id]);
  useDocumentTitle(book?.title);
  useEffect(() => setQty(1), [id]);

  if (loading && !book) return <Spinner block label={t('Loading book')} />;
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;

  const inCart = items.find((i) => i.bookId === book._id)?.quantity || 0;
  const out = book.stock < 1;

  return (
    <div className="container page">
      <Link to="/books" className="back-link"><ChevronLeft size={16} aria-hidden="true" /> {t('All books')}</Link>
      <div className="detail">
        <div className="detail-cover"><BookCover book={book} /></div>
        <div className="detail-info">
          <Link to={`/books?category=${encodeURIComponent(book.category)}`} className="tag">{t(book.category)}</Link>
          <h1>{book.title}</h1>
          <p className="detail-author">{t('by {author}', { author: book.author })}</p>
          <p className="detail-price">{formatPrice(book.price)}</p>
          <p className={`stock ${out ? 'stock-out' : book.stock <= 5 ? 'stock-low' : 'stock-in'}`}>
            {out ? t('Out of stock') : book.stock <= 5 ? t('Only {count} left in stock', { count: book.stock }) : t('In stock ({count} available)', { count: book.stock })}
          </p>
          <p className="detail-desc">{book.description}</p>

          <div className="detail-buy">
            {!out && <QuantityControl value={qty} max={Math.max(book.stock - inCart, 1)} onChange={(v) => setQty(Math.max(1, v))} />}
            <button className="btn btn-dark" disabled={out} onClick={() => addItem(book, qty) && setQty(1)}>
              <ShoppingBag size={18} aria-hidden="true" /> {out ? t('Out of stock') : t('Add to cart')}
            </button>
            {inCart > 0 && <Link to="/cart" className="link-arrow">{t('{count} in your cart, view cart', { count: inCart })}</Link>}
          </div>

          <dl className="detail-facts">
            {book.isbn && (<><dt>{t('ISBN')}</dt><dd>{book.isbn}</dd></>)}
            <dt>{t('Added')}</dt><dd>{formatDate(book.createdAt)}</dd>
          </dl>
        </div>
      </div>

      {related.data?.length > 0 && (
        <section className="section-inline">
          <h2>{t('More in {category}', { category: t(book.category) })}</h2>
          <div className="book-grid">{related.data.map((b) => <BookCard key={b._id} book={b} />)}</div>
        </section>
      )}
    </div>
  );
}
