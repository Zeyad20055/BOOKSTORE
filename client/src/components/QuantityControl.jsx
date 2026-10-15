import { Minus, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function QuantityControl({ value, max, onChange, label = 'Quantity' }) {
  const { t } = useLanguage();
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" className="icon-btn" onClick={() => onChange(value - 1)} aria-label={t('Decrease quantity')}><Minus size={16} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" className="icon-btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t('Increase quantity')}><Plus size={16} /></button>
    </div>
  );
}
