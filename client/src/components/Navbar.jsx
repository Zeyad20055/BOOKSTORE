import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, LogOut, ClipboardList, LayoutDashboard, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { language, isArabic, setLanguage, t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  // Close menus whenever the page changes.
  useEffect(() => { setOpen(false); setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/books?search=${encodeURIComponent(q.trim())}` : '/books');
    setOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label={t('Marginalia Books, home')}>Marginalia</Link>

        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label={t('Main navigation')}>
          <NavLink to="/" end>{t('Home')}</NavLink>
          <NavLink to="/books">{t('Books')}</NavLink>
          {user && <NavLink to="/orders">{t('My orders')}</NavLink>}
          {isAdmin && <NavLink to="/admin">{t('Admin')}</NavLink>}
          <form className="nav-search" onSubmit={submit} role="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search title or author')} aria-label={t('Search books')} />
          </form>
          {!user && (
            <div className="nav-auth-mobile">
              <Link to="/login" className="btn btn-outline btn-sm">{t('Log in')}</Link>
              <Link to="/register" className="btn btn-dark btn-sm">{t('Sign up')}</Link>
            </div>
          )}
        </nav>

        <div className="nav-actions">
          <button className="language-toggle" type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} aria-label={t('Switch language')} title={t('Switch language')}>
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
          <Link to="/cart" className="icon-btn cart-link" aria-label={t(count === 1 ? 'Cart, {count} item' : 'Cart, {count} items', { count })}>
            <ShoppingBag size={22} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>

          {user ? (
            <div className="account" ref={menuRef}>
              <button className="account-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
                <UserRound size={18} aria-hidden="true" /> <span className="account-name">{user.name.split(' ')[0]}</span>
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head"><strong>{user.name}</strong><small>{user.email}</small></div>
                  <Link to="/orders" role="menuitem"><ClipboardList size={16} aria-hidden="true" /> {t('My orders')}</Link>
                  {isAdmin && <Link to="/admin" role="menuitem"><LayoutDashboard size={16} aria-hidden="true" /> {t('Admin dashboard')}</Link>}
                  <button role="menuitem" onClick={() => { logout(); navigate('/'); }}><LogOut size={16} aria-hidden="true" /> {t('Log out')}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-desktop">
              <Link to="/login" className="btn btn-outline btn-sm">{t('Log in')}</Link>
              <Link to="/register" className="btn btn-dark btn-sm">{t('Sign up')}</Link>
            </div>
          )}

          <button className="icon-btn nav-toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? t('Close menu') : t('Open menu')} aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
