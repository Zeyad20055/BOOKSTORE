import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <p className="brand brand-footer">Marginalia</p>
          <p className="footer-note">{t('A small bookstore for people who read in the margins.')}</p>
        </div>
        <nav aria-label={t('Footer navigation')}>
          <Link to="/books">{t('All books')}</Link>
          <Link to="/cart">{t('My cart')}</Link>
          <Link to="/orders">{t('My orders')}</Link>
        </nav>
        <p className="footer-note">{t('Online payments are not integrated. You pay when the order arrives.')}</p>
      </div>
    </footer>
  );
}
