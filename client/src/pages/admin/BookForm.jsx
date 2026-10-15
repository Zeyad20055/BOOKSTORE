import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FormField from '../../components/FormField';
import BookCover from '../../components/BookCover';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { bookApi, errorMessage, fieldErrors } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const EMPTY = { title: '', author: '', category: '', price: '', stock: '', isbn: '', coverUrl: '', description: '' };

/** One form for both "Add book" (/admin/books/new) and "Edit book" (/admin/books/:id/edit). */
export default function BookForm() {
  const { t } = useLanguage();
  const { id } = useParams();
  const editing = Boolean(id);
  useDocumentTitle(editing ? t('Edit book') : t('Add a book'));
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const existing = useFetch(() => (editing ? bookApi.get(id) : Promise.resolve(null)), [id]);
  const categories = useFetch(() => bookApi.categories(), []);
  useEffect(() => {
    const b = existing.data;
    if (b) setForm({ title: b.title, author: b.author, category: b.category, price: String(b.price), stock: String(b.stock), isbn: b.isbn || '', coverUrl: b.coverUrl || '', description: b.description });
  }, [existing.data]);

  if (editing && existing.loading) return <Spinner block />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t('Title is required');
    if (!form.author.trim()) e.author = t('Author is required');
    if (form.category.trim().length < 2) e.category = t('Choose or type a category');
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) e.price = t('Enter a price of 0 or more');
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = t('Enter a whole number of 0 or more');
    if (form.description.trim().length < 10) e.description = t('Write at least 10 characters');
    if (form.coverUrl.trim() && !/^https?:\/\/\S+$/i.test(form.coverUrl.trim())) e.coverUrl = t('Use a full http(s) image address');
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true); setFormError('');
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editing) await bookApi.update(id, payload); else await bookApi.create(payload);
      toast.success(editing ? t('Book updated') : t('Book added'));
      navigate('/admin/books');
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(fieldErrors(err)).map(([key, value]) => [key, t(value)])));
      setFormError(t(errorMessage(err)));
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/admin/books" className="back-link"><ChevronLeft size={16} aria-hidden="true" /> {t('Back to books')}</Link>
      <header className="admin-head"><h1>{editing ? t('Edit book') : t('Add a book')}</h1></header>
      <form className="form-card wide" onSubmit={submit} noValidate>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="field-row">
          <FormField label={t('Title')} value={form.title} onChange={set('title')} error={errors.title} maxLength={200} />
          <FormField label={t('Author')} value={form.author} onChange={set('author')} error={errors.author} maxLength={120} />
        </div>
        <div className="field-row field-row-3">
          <FormField label={t('Category')} value={form.category} onChange={set('category')} error={errors.category} list="category-options" maxLength={60} />
          <FormField label={t('Price')} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} error={errors.price} />
          <FormField label={t('Stock quantity')} type="number" min="0" step="1" value={form.stock} onChange={set('stock')} error={errors.stock} />
        </div>
        <datalist id="category-options">{(categories.data || []).map((c) => <option key={c} value={c} label={t(c)} />)}</datalist>
        <div className="field-row">
          <FormField label={t('ISBN (optional)')} value={form.isbn} onChange={set('isbn')} error={errors.isbn} hint={t('10 or 13 digits')} />
          <FormField label={t('Cover image URL (optional)')} value={form.coverUrl} onChange={set('coverUrl')} error={errors.coverUrl} placeholder="https://..." />
        </div>
        {form.title && (
          <div className="cover-preview">
            <div className="thumb thumb-lg"><BookCover key={form.coverUrl} book={{ title: form.title, author: form.author, coverUrl: form.coverUrl.trim() }} /></div>
            <small className="muted">{t('Cover preview. A typographic cover is used when the image is missing or fails to load.')}</small>
          </div>
        )}
        <FormField as="textarea" rows={6} label={t('Description')} value={form.description} onChange={set('description')} error={errors.description} maxLength={3000} />
        <div className="form-actions">
          <Link to="/admin/books" className="btn btn-outline">{t('Cancel')}</Link>
          <button className="btn btn-dark" disabled={busy}>{busy ? t('Saving...') : editing ? t('Save changes') : t('Add book')}</button>
        </div>
      </form>
    </>
  );
}
