import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useHighlight = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [storedDateParam, setStoredDateParam] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    const date = params.get('date');

    if (highlight) {
      setHighlightId(highlight);
      if (date) setStoredDateParam(date);

      // Clean URL
      params.delete('highlight');
      params.delete('date');
      const newSearch = params.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });

      // Remove highlight after 2.5s
      const timer = setTimeout(() => setHighlightId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  // Scroll to element with retry
  useEffect(() => {
    if (!highlightId) return;
    const tryScroll = (attempts: number) => {
      const el = document.querySelector(`[data-record-id="${highlightId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts > 0) {
        setTimeout(() => tryScroll(attempts - 1), 500);
      }
    };
    const timer = setTimeout(() => tryScroll(6), 300);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const isHighlighted = useCallback((id: string) => highlightId === id, [highlightId]);

  return { highlightId, isHighlighted, dateParam: storedDateParam };
};
