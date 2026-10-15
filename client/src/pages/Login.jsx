import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { errorMessage } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  useDocumentTitle(t('Log in'));
  const { user, login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once logged in (here or already), send people to where they were going; admins land on their dashboard.
  if (user) return <Navigate to={from || (user.role === 'admin' ? '/admin' : '/')} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(form);
      toast.success(t('Welcome back, {name}', { name: u.name.split(' ')[0] }));
    } catch (err) {
      setError(t(errorMessage(err)));
      setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <form className="form-card" onSubmit={submit}>
        <h1>{t('Log in')}</h1>
        {from && <p className="muted">{t('Log in to continue.')}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <FormField label={t('Email')} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <FormField label={t('Password')} type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? t('Logging in...') : t('Log in')}</button>
        <p className="form-foot">{t('New here?')} <Link to="/register" state={location.state} className="link">{t('Create an account')}</Link></p>
      </form>
    </div>
  );
}
