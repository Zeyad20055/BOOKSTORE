// Keep currency stable while formatting dates and numbers for the selected language.
export const getLocale = () => (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar-EG' : 'en-US');
export const CURRENCY = 'USD';

export const formatPrice = (n) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: CURRENCY }).format(Number(n) || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString(getLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
export const formatDateTime = (d) =>
  new Date(d).toLocaleString(getLocale(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const shortId = (id = '') => id.slice(-6).toUpperCase();
