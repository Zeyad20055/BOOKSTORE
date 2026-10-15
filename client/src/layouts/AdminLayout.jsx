import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Library, ClipboardList, Users, Store, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLayout() {
  const { isArabic, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/admin', label: t('Dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/books', label: t('Books'), icon: Library },
    { to: '/admin/orders', label: t('Orders'), icon: ClipboardList },
    { to: '/admin/users', label: t('Users'), icon: Users },
  ];
  return (
    <div className="admin">
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <Link to="/admin" className="brand brand-admin">Marginalia <small>{t('Admin')}</small></Link>
        <button className="language-toggle admin-language" type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} aria-label={t('Switch language')}>
          {isArabic ? 'EN' : 'AR'}
        </button>
        <nav aria-label={t('Admin')} onClick={() => setOpen(false)}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}><Icon size={18} aria-hidden="true" /> {label}</NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/"><Store size={18} aria-hidden="true" /> {t('View storefront')}</Link>
          <small>{user?.email}</small>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? t('Close admin menu') : t('Open admin menu')}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="brand">{t('Admin')}</span>
          <button className="language-toggle" type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} aria-label={t('Switch language')}>
            {isArabic ? 'EN' : 'AR'}
          </button>
        </div>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  );
}
