import { Fragment, useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import StatusBadge, { ORDER_STATUSES, statusLabel } from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { orderApi, errorMessage } from '../../services/api';
import { formatPrice, formatDateTime, shortId } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminOrders() {
  const { isArabic, t } = useLanguage();
  useDocumentTitle(t('Manage orders'));
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useFetch(() => orderApi.all({ status, page, limit: 15 }), [status, page]);

  const changeStatus = async (order, next) => {
    if (next === order.status) return;
    if (next === 'cancelled' && !window.confirm(t('Cancel this order? The books will be returned to stock and this cannot be undone.'))) return;
    try {
      await orderApi.setStatus(order._id, next);
      toast.success(t('Order #{id} is now {status}', { id: shortId(order._id), status: statusLabel(next, isArabic).toLowerCase() }));
      reload();
    } catch (err) { toast.error(t(errorMessage(err))); reload(); }
  };

  return (
    <>
      <header className="admin-head">
        <h1>{t('Orders')}</h1>
        <label className="select-wrap">
          <span className="sr-only">{t('Filter by status')}</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t('All statuses')}</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, isArabic)}</option>)}
          </select>
        </label>
      </header>

      {loading && !data ? <Spinner block /> : error ? <ErrorState message={error} onRetry={reload} /> : data.orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('No orders found')}>{status ? t('No orders have this status.') : t('Orders will appear here once customers check out.')}</EmptyState>
      ) : (
        <>
          <div className={`table-wrap ${loading ? 'is-refreshing' : ''}`}>
            <table className="table">
              <thead><tr><th>{t('Order')}</th><th>{t('Customer')}</th><th>{t('Date')}</th><th>{t('Status')}</th><th className="num">{t('Total')}</th><th className="actions-col"><span className="sr-only">{t('Details')}</span></th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <Fragment key={o._id}>
                    <tr>
                      <td>#{shortId(o._id)}</td>
                      <td>{o.user?.name || t('Deleted user')}<small className="block muted">{o.user?.email}</small></td>
                      <td>{formatDateTime(o.createdAt)}</td>
                      <td>
                        {o.status === 'cancelled' ? <StatusBadge status="cancelled" /> : (
                          <select className="status-select" value={o.status} aria-label={t('Status of order {id}', { id: shortId(o._id) })} onChange={(e) => changeStatus(o, e.target.value)}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, isArabic)}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="num">{formatPrice(o.total)}</td>
                      <td className="actions-col">
                        <button className="icon-btn" onClick={() => setOpenId(openId === o._id ? null : o._id)} aria-expanded={openId === o._id} aria-label={t('{action} details of order {id}', { action: t(openId === o._id ? 'Hide' : 'Show'), id: shortId(o._id) })}>
                          {openId === o._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>
                    {openId === o._id && (
                      <tr className="row-detail">
                        <td colSpan={6}>
                          <div className="detail-grid">
                            <div>
                              <h3>{t('Items')}</h3>
                              <ul className="plain-list">
                                {o.items.map((i) => <li key={`${i.book}-${i.title}`}>{i.quantity} × {i.title} <span className="muted">{t('at')} {formatPrice(i.price)}</span></li>)}
                              </ul>
                            </div>
                            <div>
                              <h3>{t('Delivery')}</h3>
                              <address>{o.shippingAddress?.fullName}<br />{o.shippingAddress?.address}<br />{o.shippingAddress?.city} {o.shippingAddress?.postalCode}<br />{o.shippingAddress?.phone}</address>
                              <p className="muted">{t('Pay on delivery')}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
