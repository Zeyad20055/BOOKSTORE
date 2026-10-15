import { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi, errorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminUsers() {
  const { t } = useLanguage();
  useDocumentTitle(t('Manage users'));
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setPage(1), [debounced]);
  const { data, loading, error, reload } = useFetch(() => userApi.list({ search: debounced.trim(), page, limit: 15 }), [debounced, page]);

  const changeRole = async (u, role) => {
    try { await userApi.setRole(u._id, role); toast.success(t('{name} is now {role}', { name: u.name, role: t(role === 'admin' ? 'Admin' : 'User') })); reload(); }
    catch (err) { toast.error(t(errorMessage(err))); reload(); }
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try { await userApi.remove(toDelete._id); toast.success(t('Deleted {name}', { name: toDelete.name })); setToDelete(null); reload(); }
    catch (err) { toast.error(t(errorMessage(err))); } finally { setDeleting(false); }
  };

  return (
    <>
      <header className="admin-head"><h1>{t('Users')}</h1></header>
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search by name or email')} aria-label={t('Search users')} />
        </div>
      </div>

      {loading && !data ? <Spinner block /> : error ? <ErrorState message={error} onRetry={reload} /> : data.users.length === 0 ? (
        <EmptyState title={t('No users found')}>{t('Nobody matches that search.')}</EmptyState>
      ) : (
        <>
          <div className={`table-wrap ${loading ? 'is-refreshing' : ''}`}>
            <table className="table">
              <thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Role')}</th><th>{t('Joined')}</th><th className="actions-col">{t('Actions')}</th></tr></thead>
              <tbody>
                {data.users.map((u) => {
                  const self = u._id === me._id;
                  return (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong>{self && <small className="muted"> {t('(you)')}</small>}</td>
                      <td>{u.email}</td>
                      <td>
                        <select className="status-select" value={u.role} disabled={self} aria-label={t('Role for {name}', { name: u.name })} onChange={(e) => changeRole(u, e.target.value)}>
                          <option value="user">{t('User')}</option><option value="admin">{t('Admin')}</option>
                        </select>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="actions-col">
                        <button className="icon-btn icon-danger" disabled={self} onClick={() => setToDelete(u)} aria-label={t('Delete {name}', { name: u.name })}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={Boolean(toDelete)} danger busy={deleting} title={t('Delete this user?')}
        message={toDelete ? t('{name} ({email}) will lose access. Their past orders stay in the system.', { name: toDelete.name, email: toDelete.email }) : ''}
        confirmLabel={t('Delete user')} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </>
  );
}
