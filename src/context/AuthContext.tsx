import type { AuthResult, AuthUser } from '@/services/auth.service';
import {
  confirmPasswordReset as confirmPasswordResetService,
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  register as registerService,
  resetPassword as resetPasswordService,
} from '@/services/auth.service';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      const current = await getCurrentUser();
      if (!mounted) return;
      setUser(current);
      setLoading(false);
    };
    void loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginService(email, password);
    if (result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const result = await registerService(email, password, fullName);
    if (result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await logoutService();
    if (result.ok) setUser(null);
    return result;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return resetPasswordService(email);
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    return confirmPasswordResetService(token, newPassword);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, confirmPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
