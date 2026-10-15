import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { errorMessage, fieldErrors } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  useDocumentTitle(t('Create account'));
  const { user, register } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from || '/'} replace />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (form.name.trim().length < 2) local.name = t('Enter your name');
    if (form.password.length < 8) local.password = t('Use at least 8 characters');
    if (form.confirm !== form.password) local.confirm = t('Passwords do not match');
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true); setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success(t('Account created'));  // the guard above redirects once the user is set
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(fieldErrors(err)).map(([key, value]) => [key, t(value)])));
      setError(t(errorMessage(err)));
      setBusy(false);
    }
  };

  return (
    <div className="container auth">
      <form className="form-card" onSubmit={submit} noValidate>
        <h1>{t('Create your account')}</h1>
        {error && <p className="form-error" role="alert">{error}</p>}
        <FormField label={t('Full name')} value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <FormField label={t('Email')} type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <FormField label={t('Password')} type="password" value={form.password} onChange={set('password')} error={errors.password} hint={t('At least 8 characters')} autoComplete="new-password" />
        <FormField label={t('Confirm password')} type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? t('Creating account...') : t('Create account')}</button>
        <p className="form-foot">{t('Already registered?')} <Link to="/login" state={location.state} className="link">{t('Log in')}</Link></p>
      </form>
    </div>
  );
}
