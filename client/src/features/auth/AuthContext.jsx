import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { user, token } = await authService.login({ identifier, password });
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const registerAdmin = useCallback(async (payload) => {
    const { user, token } = await authService.registerAdmin(payload);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    authService.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, registerAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
