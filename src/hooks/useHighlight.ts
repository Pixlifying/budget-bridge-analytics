import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useHighlight = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const highlightParam = searchParams.get('highlight');
  const dateParam = searchParams.get('date');

  useEffect(() => {
    if (highlightParam) {
      setHighlightId(highlightParam);

      // Clean up URL params after reading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      newParams.delete('date');
      setSearchParams(newParams, { replace: true });

      // Remove highlight after 2.5 seconds
      const timer = setTimeout(() => {
        setHighlightId(null);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [highlightParam]);

  // Scroll to highlighted element
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-record-id="${highlightId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const isHighlighted = useCallback((id: string) => highlightId === id, [highlightId]);

  return { highlightId, isHighlighted, dateParam };
};
