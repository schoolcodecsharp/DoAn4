import { useLocalStorage } from './useLocalStorage';
import type { AuthUser } from '../types';

export function useAuth() {
  const [user, setUser] = useLocalStorage<AuthUser | null>('authUser', null);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

export type { AuthUser };
