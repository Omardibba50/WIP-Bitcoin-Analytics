import { useEffect, useState, useRef } from 'react';

export default function usePrice(symbol = 'BTC', intervalMs = 15000) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
    const bases = [envBase, ''].filter(Boolean).concat(['http://localhost:5000']);

    async function fetchPrice() {
      setLoading(true);
      let lastErr = null;
      for (const base of bases) {
        const url = `${base}/api/prices/latest?symbol=${encodeURIComponent(symbol)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`bad-status:${res.status}`);
          const json = await res.json();
          if (!mounted.current) return;
          // backend returns { data: { symbol, price, ts } }
          if (json && json.data) {
            setPrice(json.data.price ?? null);
          } else {
            setPrice(null);
          }
          setError(null);
          return; // success
        } catch (err) {
          lastErr = err;
          console.warn('usePrice fetch failed for', url, err.message || err);
          // try next base
        }
      }
      if (!mounted.current) return;
      setError(lastErr ? (lastErr.message || 'error') : 'fetch-failed');
      setPrice(null);
      setLoading(false);
    }

    fetchPrice();
    const id = setInterval(fetchPrice, intervalMs);
    return () => { mounted.current = false; clearInterval(id); };
  }, [symbol, intervalMs]);

  return { price, loading, error };
}
