import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { FileQuestion } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="container page">
      <EmptyState icon={FileQuestion} title={t('Page not found')} action={<Link to="/" className="btn btn-dark">{t('Back to the shop')}</Link>}>
        {t('The page you are looking for does not exist or has moved.')}
      </EmptyState>
    </div>
  );
}
