import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { getSession, setSession } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!getSession());

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Persistence: restore the session on page load.
  useEffect(() => { if (getSession()) loadMe(); }, [loadMe]);
  useEffect(() => {
    const out = () => { setUser(null); setProfile(null); };
    window.addEventListener('lp:signed-out', out);
    return () => window.removeEventListener('lp:signed-out', out);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setSession(data.session);
    await loadMe();
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.session) { setSession(data.session); await loadMe(); }
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}
