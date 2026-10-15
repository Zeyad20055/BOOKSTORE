import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookX } from 'lucide-react';
import BookCard from '../components/BookCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import BookGridSkeleton from '../components/BookGridSkeleton';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { bookApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Books() {
  const { t } = useLanguage();
  useDocumentTitle(t('Books'));
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);
  const sorts = [
    { value: 'newest', label: t('Newest arrivals') },
    { value: 'price_asc', label: t('Price: low to high') },
    { value: 'price_desc', label: t('Price: high to low') },
    { value: 'title', label: t('Title A to Z') },
  ];

  // The URL is the source of truth; the input keeps its own text and updates the URL after a pause.
  const [text, setText] = useState(search);
  const debounced = useDebounce(text);
  useEffect(() => { setText(search); }, [search]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '1', ...changes }).forEach(([k, v]) => (v && v !== 'newest' && v !== 'all' && !(k === 'page' && v === '1') ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  useEffect(() => { if (debounced.trim() !== search) update({ search: debounced.trim() }); /* eslint-disable-next-line */ }, [debounced]);

  const categories = useFetch(() => bookApi.categories(), []);
  const { data, loading, error, reload } = useFetch(
    () => bookApi.list({ search, category, sort, page, limit: 12 }),
    [search, category, sort, page]
  );

  return (
    <div className="container page">
      <header className="page-head"><h1>{t('Books')}</h1><p>{data ? t('{count} titles', { count: data.total }) : t('Loading the shelves')}</p></header>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Search by title or author')} aria-label={t('Search books')} />
        </div>
        <label className="select-wrap">
          <span className="sr-only">{t('Sort books')}</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="chips" role="group" aria-label={t('Filter by category')}>
        <button className={`chip ${!category ? 'is-active' : ''}`} onClick={() => update({ category: '' })}>{t('All')}</button>
        {(categories.data || []).map((c) => (
          <button key={c} className={`chip ${category === c ? 'is-active' : ''}`} onClick={() => update({ category: c })}>{t(c)}</button>
        ))}
      </div>

      {loading && !data ? <BookGridSkeleton count={8} /> : error ? <ErrorState message={error} onRetry={reload} /> : data.books.length === 0 ? (
        <EmptyState icon={BookX} title={t('No books match your search')} action={<button className="btn btn-outline" onClick={() => { setText(''); setParams({}); }}>{t('Clear filters')}</button>}>
          {t('Try a different title, author or category.')}
        </EmptyState>
      ) : (
        <div className={loading ? 'is-refreshing' : ''}>
          <div className="book-grid">{data.books.map((b) => <BookCard key={b._id} book={b} />)}</div>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      )}
    </div>
  );
}
