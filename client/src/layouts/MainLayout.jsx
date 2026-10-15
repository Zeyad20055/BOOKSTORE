import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

export default function MainLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <a href="#main" className="skip-link">{t('Skip to content')}</a>
      <Navbar />
      <main id="main" className="main"><Outlet /></main>
      <Footer />
    </>
  );
}
