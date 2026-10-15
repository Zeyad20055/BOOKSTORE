import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import FormField from '../components/FormField';
import BookCover from '../components/BookCover';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { orderApi, errorMessage, fieldErrors } from '../services/api';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function Checkout() {
  const { t } = useLanguage();
  useDocumentTitle(t('Checkout'));
  const { items, total, clear, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.name || '', phone: '', address: '', city: '', postalCode: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  if (items.length === 0 && !busy) {
    return (
      <div className="container page narrow">
        <h1>{t('Checkout')}</h1>
        <p>{t('Your cart is empty.')} <Link to="/books" className="link">{t('Browse books')}</Link> {t('to add something.')}</p>
      </div>
    );
  }

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (form.fullName.trim().length < 2) local.fullName = t('Enter your full name');
    if (form.phone.trim().length < 6) local.phone = t('Enter a phone number');
    if (form.address.trim().length < 5) local.address = t('Enter your street address');
    if (form.city.trim().length < 2) local.city = t('Enter your city');
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true); setFormError('');
    try {
      // Only ids and quantities are sent. The server looks up real prices and checks stock.
      const order = await orderApi.create({ items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })), shippingAddress: form });
      clear();
      toast.success(t('Order placed'));
      navigate(`/orders/${order._id}/confirmation`, { replace: true });
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(fieldErrors(err)).map(([key, value]) => [key, t(value)])));
      setFormError(t(errorMessage(err)));
      if ([404, 409].includes(err.response?.status)) refresh(); // stock changed: bring the cart up to date
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <header className="page-head"><h1>{t('Checkout')}</h1></header>
      <div className="cart-layout">
        <form className="form-card" onSubmit={submit} noValidate>
          <h2>{t('Delivery details')}</h2>
          <div className="notice"><Info size={18} aria-hidden="true" /><p>{t('Online payments are not integrated in this store. You will pay in cash when your order is delivered.')}</p></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <FormField label={t('Full name')} value={form.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
          <FormField label={t('Phone')} type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
          <FormField label={t('Street address')} value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
          <div className="field-row">
            <FormField label={t('City')} value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
            <FormField label={t('Postal code (optional)')} value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
          </div>
          <button className="btn btn-dark btn-block" disabled={busy}>{busy ? t('Placing order...') : t('Place order, {total}', { total: formatPrice(total) })}</button>
        </form>

        <aside className="summary">
          <h2>{t('Your books')}</h2>
          <ul className="mini-list">
            {items.map((i) => (
              <li key={i.bookId}>
                <div className="mini-cover"><BookCover book={i} /></div>
                <div><strong>{i.title}</strong><small>{i.quantity} x {formatPrice(i.price)}</small></div>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl><div className="summary-total"><dt>{t('Total')}</dt><dd>{formatPrice(total)}</dd></div></dl>
          <p className="note">{t('The final price is confirmed by the server when you place the order.')}</p>
        </aside>
      </div>
    </div>
  );
}
