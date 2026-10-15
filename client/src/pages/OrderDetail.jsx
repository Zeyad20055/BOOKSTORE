import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import BookCover from '../components/BookCover';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import useFetch from '../hooks/useFetch';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { orderApi } from '../services/api';
import { formatPrice, formatDateTime, shortId } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

/** Shows one order. With `confirmation` it doubles as the "thank you" page after checkout. */
export default function OrderDetail({ confirmation = false }) {
  const { t } = useLanguage();
  const { id } = useParams();
  const { data: order, loading, error, reload } = useFetch(() => orderApi.get(id), [id]);
  useDocumentTitle(confirmation ? t('Order confirmed') : t('Order details'));

  if (loading) return <Spinner block label={t('Loading order')} />;
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;

  const a = order.shippingAddress || {};
  return (
    <div className="container page narrow">
      {confirmation && (
        <div className="confirm">
          <CheckCircle2 size={44} strokeWidth={1.5} aria-hidden="true" />
          <h1>{t('Thank you, your order is placed')}</h1>
          <p>{t('We will prepare it right away. Order reference #{id}.', { id: shortId(order._id) })}</p>
        </div>
      )}
      {!confirmation && <header className="page-head"><h1>{t('Order #{id}', { id: shortId(order._id) })}</h1><p>{formatDateTime(order.createdAt)}</p></header>}

      <section className="panel">
        <div className="panel-head"><h2>{t('Items')}</h2><StatusBadge status={order.status} /></div>
        <ul className="mini-list">
          {order.items.map((i) => (
            <li key={`${i.book}-${i.title}`}>
              <div className="mini-cover"><BookCover book={i} /></div>
              <div><strong>{i.title}</strong><small>{i.author} · {i.quantity} x {formatPrice(i.price)}</small></div>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-total panel-total"><span>{t('Total')}</span><strong>{formatPrice(order.total)}</strong></div>
      </section>

      <section className="panel">
        <h2>{t('Delivery')}</h2>
        <address>{a.fullName}<br />{a.address}<br />{a.city}{a.postalCode ? `, ${a.postalCode}` : ''}<br />{a.phone}</address>
        <div className="notice"><Info size={18} aria-hidden="true" /><p>{t('Payment: pay on delivery. Online payments are not integrated.')}</p></div>
      </section>

      <div className="page-actions">
        <Link to="/orders" className="btn btn-outline">{t('All my orders')}</Link>
        <Link to="/books" className="btn btn-dark">{t('Keep browsing')}</Link>
      </div>
    </div>
  );
}
