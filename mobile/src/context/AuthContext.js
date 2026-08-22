import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_URL } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { nama, email, token }
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        return { ok: true };
      }
      // Backend belum siap (501) — simulasi login sukses untuk demo
      if (res.status === 501) {
        setUser({ nama: email.split('@')[0], email, token: 'demo-token' });
        return { ok: true };
      }
      return { ok: false, message: data.message || 'Email atau password salah.' };
    } catch {
      // Offline / backend belum jalan — mode demo
      setUser({ nama: email.split('@')[0], email, token: 'demo-token' });
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (nama, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        return { ok: true };
      }
      if (res.status === 501) {
        setUser({ nama, email, token: 'demo-token' });
        return { ok: true };
      }
      return { ok: false, message: data.message || 'Registrasi gagal.' };
    } catch {
      setUser({ nama, email, token: 'demo-token' });
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
