import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSettings } from '../api/settings';

/**
 * Konteks pengaturan situs (nama lembaga, kontak, sosial media, statistik, dll).
 * Di-fetch saat aplikasi dimuat; menyediakan method refetch agar perubahan
 * dari admin panel langsung tercermin seketika di frontend tanpa refresh penuh.
 */
const SettingsContext = createContext({
  settings: {},
  loading: true,
  refetch: () => Promise.resolve({}),
  updateSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    return getSettings()
      .then((res) => {
        const data = res?.data || res || {};
        setSettings(data);
        return data;
      })
      .catch(() => ({}))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: fetchSettings, updateSettings: setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
