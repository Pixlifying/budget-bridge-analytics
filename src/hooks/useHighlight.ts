import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useHighlight = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [storedDateParam, setStoredDateParam] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  const highlightParam = searchParams.get('highlight');
  const dateParam = searchParams.get('date');

  // Store params in state BEFORE cleaning URL
  useEffect(() => {
    if (highlightParam && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      setHighlightId(highlightParam);
      if (dateParam) {
        setStoredDateParam(dateParam);
      }

      // Clean up URL params after storing
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
  }, [highlightParam, dateParam]);

  // Scroll to highlighted element with retry
  useEffect(() => {
    if (highlightId) {
      const tryScroll = (attempts: number) => {
        const el = document.querySelector(`[data-record-id="${highlightId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (attempts > 0) {
          setTimeout(() => tryScroll(attempts - 1), 500);
        }
      };
      // Start trying after 300ms, retry up to 6 times (3 seconds total)
      const timer = setTimeout(() => tryScroll(6), 300);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const isHighlighted = useCallback((id: string) => highlightId === id, [highlightId]);

  return { highlightId, isHighlighted, dateParam: storedDateParam || dateParam };
};
