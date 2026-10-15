import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import useFetch from '../hooks/useFetch';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { orderApi } from '../services/api';
import { formatPrice, formatDate, shortId } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

export default function Orders() {
  const { t } = useLanguage();
  useDocumentTitle(t('My orders'));
  const { data: orders, loading, error, reload } = useFetch(() => orderApi.mine(), []);

  return (
    <div className="container page narrow">
      <header className="page-head"><h1>{t('My orders')}</h1></header>
      {loading ? <Spinner block /> : error ? <ErrorState message={error} onRetry={reload} /> : orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('No orders yet')} action={<Link to="/books" className="btn btn-dark">{t('Browse books')}</Link>}>
          {t('When you place an order it will show up here.')}
        </EmptyState>
      ) : (
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="order-row">
                <div><strong>#{shortId(o._id)}</strong><small>{formatDate(o.createdAt)}</small></div>
                <div className="order-titles">{o.items.map((i) => `${i.title} x${i.quantity}`).join(', ')}</div>
                <StatusBadge status={o.status} />
                <strong>{formatPrice(o.total)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
