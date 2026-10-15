import { useLanguage } from '../context/LanguageContext';

export default function BookGridSkeleton({ count = 4 }) {
  const { t } = useLanguage();
  return (
    <div className="book-grid skeleton-grid" role="status" aria-label={t('Loading books')}>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton-cover" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-author" />
          <div className="skeleton-line skeleton-price" />
        </div>
      ))}
    </div>
  );
}
