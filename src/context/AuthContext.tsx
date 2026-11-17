import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken } from '../lib/api';

export interface AdminUser { id: number; name: string; email: string; role: string }
interface AuthState { user: AdminUser | null; ready: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void }

const Ctx = createContext<AuthState>({ user: null, ready: false, login: async () => undefined, logout: () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post('/auth/login', { email, password });
    setToken(r.data.token);
    setUser(r.data.user);
  }
  function logout() { setToken(null); setUser(null); }

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
