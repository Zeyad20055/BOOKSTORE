import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const TONES = [
  ['#172554', '#d4a853'],
  ['#eff4fb', '#172554'],
  ['#2563eb', '#ffffff'],
  ['#1e3a8a', '#f8fafc'],
  ['#dbe5f2', '#172554'],
];

/** Shows the cover image; when the URL is empty or fails to load, draws a typographic cover instead. */
export default function BookCover({ book, className = '' }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const hash = [...(book.title || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const [bg, fg] = TONES[hash % TONES.length];

  if (!book.coverUrl || failed) {
    return (
      <div className={`cover cover-fallback ${className}`} style={{ background: bg, color: fg }} role="img" aria-label={t('Cover of {title}', { title: book.title })}>
        <span className="cover-title">{book.title}</span>
        <span className="cover-author">{book.author}</span>
      </div>
    );
  }
  return (
    <img
      className={`cover ${className}`}
      src={book.coverUrl}
      alt={t('Cover of {title}', { title: book.title })}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
