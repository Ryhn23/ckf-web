import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi saat aplikasi dimuat
  useEffect(() => {
    authApi
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* abaikan — tetap bersihkan state lokal */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
