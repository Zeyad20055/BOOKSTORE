import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Marginalia Books` : 'Marginalia Books';
  }, [title]);
}
