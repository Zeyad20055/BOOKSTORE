import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import BookCover from '../../components/BookCover';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { bookApi, errorMessage } from '../../services/api';
import { formatPrice } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

/** Inline stock editor: type a new number and press Enter or leave the field to save. */
function StockCell({ book, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [value, setValue] = useState(String(book.stock));
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(String(book.stock)), [book.stock]);

  const save = async () => {
    const n = Number(value);
    if (value === String(book.stock)) return;
    if (!Number.isInteger(n) || n < 0) { toast.error(t('Stock must be a whole number, 0 or more')); setValue(String(book.stock)); return; }
    setBusy(true);
    try {
      const { title, author, description, price, category, coverUrl, isbn } = book;
      await bookApi.update(book._id, { title, author, description, price, category, coverUrl, isbn, stock: n });
      toast.success(t('Stock updated for "{title}"', { title: book.title }));
      onSaved();
    } catch (err) { toast.error(t(errorMessage(err))); setValue(String(book.stock)); } finally { setBusy(false); }
  };

  return (
    <input className={`stock-input ${book.stock === 0 ? 'is-out' : book.stock <= 5 ? 'is-low' : ''}`} type="number" min="0" step="1"
    value={value} disabled={busy} aria-label={t('Stock for {title}', { title: book.title })}
      onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
  );
}

export default function AdminBooks() {
  const { t } = useLanguage();
  useDocumentTitle(t('Manage books'));
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setPage(1), [debounced]);
  const { data, loading, error, reload } = useFetch(() => bookApi.list({ search: debounced.trim(), page, limit: 10, sort: 'newest' }), [debounced, page]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await bookApi.remove(toDelete._id);
      toast.success(t('Deleted "{title}"', { title: toDelete.title }));
      setToDelete(null);
      if (data.books.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) { toast.error(t(errorMessage(err))); } finally { setDeleting(false); }
  };

  return (
    <>
      <header className="admin-head">
        <h1>{t('Books')}</h1>
        <Link to="/admin/books/new" className="btn btn-dark"><Plus size={18} aria-hidden="true" /> {t('Add book')}</Link>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search by title or author')} aria-label={t('Search books')} />
        </div>
      </div>

      {loading && !data ? <Spinner block /> : error ? <ErrorState message={error} onRetry={reload} /> : data.books.length === 0 ? (
        <EmptyState title={t('No books found')} action={<Link to="/admin/books/new" className="btn btn-dark">{t('Add a book')}</Link>}>
          {debounced ? t('Nothing matches that search.') : t('Your catalogue is empty. Add the first book or run the seed command.')}
        </EmptyState>
      ) : (
        <>
          <div className={`table-wrap ${loading ? 'is-refreshing' : ''}`}>
            <table className="table">
              <thead><tr><th>{t('Book')}</th><th>{t('Category')}</th><th className="num">{t('Price')}</th><th className="num">{t('Stock')}</th><th className="actions-col">{t('Actions')}</th></tr></thead>
              <tbody>
                {data.books.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div className="table-book">
                        <div className="thumb"><BookCover book={b} /></div>
                        <div><strong>{b.title}</strong><small className="block muted">{b.author}</small></div>
                      </div>
                    </td>
                    <td>{t(b.category)}</td>
                    <td className="num">{formatPrice(b.price)}</td>
                    <td className="num"><StockCell book={b} onSaved={reload} /></td>
                    <td className="actions-col">
                      <Link to={`/admin/books/${b._id}/edit`} className="icon-btn" aria-label={`Edit ${b.title}`}><Pencil size={18} /></Link>
                      <button className="icon-btn icon-danger" onClick={() => setToDelete(b)} aria-label={t('Delete {title}', { title: b.title })}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={Boolean(toDelete)} danger busy={deleting} title={t('Delete this book?')}
        message={toDelete ? t('"{title}" will be removed from the store. Past orders keep their own copy of the details. This cannot be undone.', { title: toDelete.title }) : ''}
        confirmLabel={t('Delete book')} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </>
  );
}
