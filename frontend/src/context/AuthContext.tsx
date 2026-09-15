import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, readSession, type Session, type User } from '../lib/api';

const AuthContext = createContext<{ user: User | null; loading: boolean; login: (session: Session) => void; logout: () => void }>({ user: null, loading: true, login: () => {}, logout: () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const sync = async () => {
      setLoading(true);
      const session = readSession();
      try {
        if (!session) { if (active) setUser(null); return; }
        const { data } = await api.get<User>('/auth/me');
        if (active) setUser(data);
      } catch { if (active) setUser(null); }
      finally { if (active) setLoading(false); }
    };
    const expired = () => { setUser(null); setLoading(false); };
    const storage = (e: StorageEvent) => { if (e.key === 'tripmate_auth') void sync(); };
    void sync();
    window.addEventListener('session-expired', expired);
    window.addEventListener('storage', storage);
    return () => { active = false; window.removeEventListener('session-expired', expired); window.removeEventListener('storage', storage); };
  }, []);
  const login = (session: Session) => { localStorage.setItem('tripmate_auth', JSON.stringify(session)); localStorage.removeItem('authUser'); setUser(session.user); setLoading(false); };
  const logout = () => { localStorage.removeItem('tripmate_auth'); localStorage.removeItem('authUser'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useSession = () => useContext(AuthContext);
export function RequireLogin({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <main className="user-page"><p className="user-container" role="status">Đang kiểm tra phiên đăng nhập...</p></main>;
  if (!user) return <Navigate replace to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} state={{ message: 'Bạn có thể xem thông tin tự do. Vui lòng đăng nhập để đặt dịch vụ hoặc lưu lịch trình.' }} />;
  return children;
}
