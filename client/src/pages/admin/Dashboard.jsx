import { Link } from 'react-router-dom';
import { Library, Users, ClipboardList, Banknote } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { adminApi } from '../../services/api';
import { formatPrice, formatDateTime, shortId } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  useDocumentTitle(t('Admin dashboard'));
  const { data, loading, error, reload } = useFetch(() => adminApi.stats(), []);
  if (loading) return <Spinner block label={t('Loading statistics')} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, recentOrders } = data;
  const cards = [
    { label: t('Total books'), value: stats.totalBooks, icon: Library, to: '/admin/books' },
    { label: t('Registered users'), value: stats.totalUsers, icon: Users, to: '/admin/users' },
    { label: t('Orders'), value: stats.totalOrders, icon: ClipboardList, to: '/admin/orders' },
    { label: t('Sales (excl. cancelled)'), value: formatPrice(stats.totalSales), icon: Banknote, to: '/admin/orders' },
  ];

  return (
    <>
      <header className="admin-head"><h1>{t('Dashboard')}</h1></header>
      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="stat">
            <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <p className="notice notice-warn">
          {t('Stock alert:')} <strong>{stats.outOfStock}</strong> {t('out of stock and')} <strong>{stats.lowStock}</strong> {t('running low (5 or fewer).')}{' '}
          <Link to="/admin/books" className="link">{t('Review inventory')}</Link>
        </p>
      )}

      <section className="panel">
        <div className="panel-head"><h2>{t('Recent orders')}</h2><Link to="/admin/orders" className="link">{t('View all')}</Link></div>
        {recentOrders.length === 0 ? <p className="muted">{t('No orders yet.')}</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t('Order')}</th><th>{t('Customer')}</th><th>{t('Date')}</th><th>{t('Status')}</th><th className="num">{t('Total')}</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td>#{shortId(o._id)}</td>
                    <td>{o.user?.name || t('Deleted user')}<small className="block muted">{o.user?.email}</small></td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
