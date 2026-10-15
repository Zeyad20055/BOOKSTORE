import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Spinner from './Spinner';

/** Guards routes in the UI. (The API enforces the same rules on the server.) */
export default function ProtectedRoute({ adminOnly = false }) {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner block label={t('Checking your session')} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
