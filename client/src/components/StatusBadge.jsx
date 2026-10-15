import { useLanguage } from '../context/LanguageContext';

const LABELS = { placed: 'Placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
const LABELS_AR = { placed: 'تم الاستلام', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };

export default function StatusBadge({ status }) {
  const { isArabic } = useLanguage();
  return <span className={`badge badge-${status}`}>{(isArabic ? LABELS_AR : LABELS)[status] || status}</span>;
}
export const ORDER_STATUSES = Object.keys(LABELS);
export const statusLabel = (s, isArabic = false) => (isArabic ? LABELS_AR : LABELS)[s] || s;
