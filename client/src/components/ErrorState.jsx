import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="empty empty-error" role="alert">
      <AlertTriangle size={40} strokeWidth={1.25} aria-hidden="true" />
      <h2>{t("We couldn't load this")}</h2>
      <p>{t(message)}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>{t('Try again')}</button>}
    </div>
  );
}
