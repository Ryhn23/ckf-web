import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSettings } from '../api/settings';

/**
 * Konteks pengaturan situs (nama lembaga, kontak, sosial media, statistik, dll).
 * Di-fetch saat aplikasi dimuat; menyediakan method refetch agar perubahan
 * dari admin panel langsung tercermin seketika di frontend tanpa refresh penuh.
 */
const STORAGE_KEY = 'ckf_site_settings';

function getCachedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    /* abaikan */
  }
  return null;
}

const initialCached = getCachedSettings();

const SettingsContext = createContext({
  settings: initialCached || {},
  loading: false,
  hasLoaded: initialCached !== null,
  refetch: () => Promise.resolve({}),
  updateSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => initialCached || {});
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(() => initialCached !== null);

  const fetchSettings = useCallback(() => {
    setLoading(true);
    return getSettings()
      .then((res) => {
        const data = res?.data || res || {};
        setSettings(data);
        setHasLoaded(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          /* abaikan */
        }
        return data;
      })
      .catch((err) => {
        console.error('Gagal memuat pengaturan:', err);
        setHasLoaded(true);
        return {};
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* abaikan */
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchSettings();
    // Safeguard timeout: jangan biarkan halaman tertahan jika jaringan gagal total
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        hasLoaded,
        refetch: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
