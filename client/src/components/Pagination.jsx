import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Pagination({ page, pages, onChange }) {
  const { t } = useLanguage();
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label={t('Pagination')}>
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" /> {t('Previous')}
      </button>
      <span>{t('Page {page} of {pages}', { page, pages })}</span>
      <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('Next')} <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
