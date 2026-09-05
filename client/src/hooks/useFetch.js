import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook fetch sederhana dengan state loading/error/refetch.
 * @param {() => Promise<any>} fetcher fungsi async yang mengembalikan data
 * @param {Array} deps dependensi untuk re-fetch
 */
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load, ...deps]);

  return { data, loading, error, refetch: load };
}
