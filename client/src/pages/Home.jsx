import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Code2, Feather, FlaskConical, Search } from 'lucide-react';
import { useState } from 'react';
import BookCard from '../components/BookCard';
import BookCover from '../components/BookCover';
import Spinner from '../components/Spinner';
import BookGridSkeleton from '../components/BookGridSkeleton';
import ErrorState from '../components/ErrorState';
import useFetch from '../hooks/useFetch';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { bookApi } from '../services/api';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  useDocumentTitle('');
  const { data, loading, error, reload } = useFetch(async () => {
    const [{ books }, categories] = await Promise.all([bookApi.list({ sort: 'newest', limit: 12 }), bookApi.categories()]);
    return { books, categories };
  }, []);

  const books = data?.books || [];
  const shelf = books.filter((b) => b.stock > 0).slice(0, 4);
  const shelfIds = new Set(shelf.map((b) => b._id));
  const arrivals = books.filter((b) => !shelfIds.has(b._id)).slice(0, 8);
  const categoryIcons = [BookOpen, Feather, FlaskConical, Code2];
  const searchBooks = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/books?search=${encodeURIComponent(search.trim())}` : '/books');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">{t('A thoughtful collection for curious readers.')}</span>
            <h1>{t('Books worth keeping on the shelf.')}</h1>
            <p>{t('Novels, classics, big ideas and good code, picked by readers and delivered to your door. Browse freely, pay when it arrives.')}</p>
            <div className="hero-actions">
              <Link to="/books" className="btn btn-gold">{t('Browse the catalogue')} <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/register" className="btn btn-ghost-light">{t('Create an account')}</Link>
            </div>
            <form className="hero-search" onSubmit={searchBooks} role="search">
              <Search size={20} aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by title, author or category')} aria-label={t('Search books')} />
              <button className="btn btn-dark" type="submit">{t('Search')}</button>
            </form>
          </div>

          <div className="shelf" aria-label={t('Featured books')}>
            {loading ? <Spinner label={t('Loading featured books')} /> : (
              <ul className="shelf-books">
                {shelf.map((b, i) => (
                  <li key={b._id} style={{ '--i': i }}>
                    <Link to={`/books/${b._id}`} title={`${b.title}, ${formatPrice(b.price)}`}><BookCover book={b} /></Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="shelf-board" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>{t('New arrivals')}</h2>
          <Link to="/books?sort=newest" className="link-arrow">{t('See all books')} <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {loading ? <BookGridSkeleton count={4} /> : error ? <ErrorState message={error} onRetry={reload} /> : (
          <div className="book-grid">{arrivals.map((b) => <BookCard key={b._id} book={b} />)}</div>
        )}
      </section>

      {data?.categories?.length > 0 && (
        <section className="section section-beige">
          <div className="container">
            <div className="section-head"><h2>{t('Browse by category')}</h2></div>
            <ul className="category-list">
              {data.categories.map((c, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                return (
                  <li key={c}><Link to={`/books?category=${encodeURIComponent(c)}`}><span className="category-icon"><Icon size={20} aria-hidden="true" />{t(c)}</span><ArrowRight size={18} aria-hidden="true" /></Link></li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
