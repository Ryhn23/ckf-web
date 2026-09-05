import { createContext, useContext, useEffect, useState } from 'react';
import { getSettings } from '../api/settings';

/**
 * Konteks pengaturan situs (nama yayasan, kontak, sosial media, statistik, dll).
 * Di-fetch sekali saat aplikasi dimuat; komponen publik membaca dari sini agar
 * perubahan dari admin panel langsung tercermin di frontend.
 */
const SettingsContext = createContext({ settings: {}, loading: true });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((res) => setSettings(res?.data || res || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <SettingsContext.Provider value={{ settings, loading }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
