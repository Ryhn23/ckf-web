import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
