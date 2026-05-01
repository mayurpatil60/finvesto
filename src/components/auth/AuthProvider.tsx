import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { IUser } from '../../types/interfaces';
import {
  getStoredUser,
  logout as authLogout,
  refreshTokens,
} from '../../services/auth/auth.service';

interface AuthContextValue {
  user: IUser | null;
  isLoading: boolean;
  setUser: (user: IUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        // Try to restore session via stored user + refresh
        const storedUser = await getStoredUser();
        if (storedUser) {
          const refreshed = await refreshTokens();
          if (refreshed) {
            setUserState(storedUser);
          }
        }
      } catch {
        // Session expired — user must log in
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const setUser = useCallback((u: IUser | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
