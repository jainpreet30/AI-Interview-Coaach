import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ai-interview-token'));
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api.setToken(token);
    api.get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('ai-interview-token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async ({ token: accessToken, user: signedUser }) => {
    localStorage.setItem('ai-interview-token', accessToken);
    api.setToken(accessToken);
    setToken(accessToken);
    setUser(signedUser);
  };

  const logout = () => {
    localStorage.removeItem('ai-interview-token');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, login, logout, loading, isAuthenticated: Boolean(user) }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
