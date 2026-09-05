import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll ke atas setiap kali pindah halaman. */
export default function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
